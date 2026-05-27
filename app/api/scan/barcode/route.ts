import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient, requireAuthUserId } from "@/lib/supabase";
import { BARCODE_POINT, DAILY_LIMIT, canEarnPoints } from "@/lib/points";
import { ok, badRequest, unauthorized, err, serverError } from "@/lib/response";

const BarcodeSchema = z.object({
  barcode: z.string().min(1).max(50),
});

// 바코드별 제품·체크리스트 정보 (실제 서비스에서는 DB 또는 외부 API 조회)
const PRODUCT_DB: Record<string, { name: string; material: string; checklist: { id: string; label: string; required: boolean }[]; script: string }> = {
  default: {
    name: "일반 플라스틱",
    material: "PLASTIC",
    checklist: [
      { id: "c1", label: "내용물을 비웠나요?", required: true },
      { id: "c2", label: "라벨을 제거했나요?", required: true },
      { id: "c3", label: "물로 헹궜나요?", required: false },
    ],
    script: "플라스틱은 내용물을 비우고 라벨을 제거한 뒤 분리배출 해주세요.",
  },
  "8801234567890": {
    name: "페트병 500ml",
    material: "PET",
    checklist: [
      { id: "c1", label: "라벨을 떼었나요?", required: true },
      { id: "c2", label: "내용물을 씻었나요?", required: true },
      { id: "c3", label: "뚜껑을 분리했나요?", required: true },
    ],
    script: "페트병은 라벨을 제거하고, 내용물을 깨끗이 씻은 뒤 뚜껑을 분리해서 버려주세요.",
  },
};

export async function POST(req: NextRequest) {
  try {
    let userId: string;
    try { userId = await requireAuthUserId(); }
    catch { return unauthorized(); }

    const body = await req.json();
    const parsed = BarcodeSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const { barcode } = parsed.data;
    const admin = createAdminSupabaseClient();
    const today = new Date().toISOString().slice(0, 10);

    // 당일 동일 바코드 재스캔 방지
    const { data: existingScan } = await admin
      .from("scan_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("barcode", barcode)
      .gte("scanned_at", `${today}T00:00:00Z`)
      .maybeSingle();

    if (existingScan) {
      return err("ALREADY_SCANNED_TODAY", "오늘 이미 적립된 바코드입니다", 409);
    }

    // 일일 한도 확인
    const { data: cap } = await admin
      .from("daily_point_caps")
      .select("earned")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();

    const earnedToday = cap?.earned ?? 0;
    if (!canEarnPoints(earnedToday, BARCODE_POINT)) {
      return err("DAILY_LIMIT_REACHED", "오늘 포인트 한도(100pt)에 도달했습니다", 429);
    }

    // 제품 정보 조회
    const product = PRODUCT_DB[barcode] ?? PRODUCT_DB["default"];

    // 트랜잭션: point_events → scan_logs → daily_point_caps → users.total_points
    const { data: pointEvent, error: peError } = await admin
      .from("point_events")
      .insert({ user_id: userId, source: "barcode", points: BARCODE_POINT, meta: { barcode, product: product.name } })
      .select("id")
      .single();
    if (peError) return serverError("포인트 저장에 실패했습니다");

    await admin.from("scan_logs").insert({
      user_id: userId,
      barcode,
      point_event_id: pointEvent.id,
    });

    // upsert daily_point_caps
    await admin.from("daily_point_caps").upsert(
      { user_id: userId, date: today, earned: earnedToday + BARCODE_POINT },
      { onConflict: "user_id,date" }
    );

    // total_points 증가 (rpc 방식)
    await admin.rpc("increment_total_points", { uid: userId, delta: BARCODE_POINT });

    const newDailyTotal = earnedToday + BARCODE_POINT;

    return ok({
      product: { name: product.name, material: product.material },
      checklist: product.checklist,
      voice: {
        script: product.script,
        audioUrl: `/api/voice/tts?text=${encodeURIComponent(product.script)}`,
      },
      pointsAwarded: BARCODE_POINT,
      dailyTotal: newDailyTotal,
      dailyLimit: DAILY_LIMIT,
    });
  } catch (e) {
    console.error("[scan/barcode]", e);
    return serverError();
  }
}
