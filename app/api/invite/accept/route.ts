import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient, requireAuthUserId } from "@/lib/supabase";
import { INVITE_BONUS } from "@/lib/points";
import { ok, unauthorized, badRequest, err, serverError } from "@/lib/response";

const AcceptSchema = z.object({ code: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    let userId: string;
    try { userId = await requireAuthUserId(); }
    catch { return unauthorized(); }

    const body = await req.json();
    const parsed = AcceptSchema.safeParse(body);
    if (!parsed.success) return badRequest("초대 코드가 필요합니다");

    const { code } = parsed.data;
    const admin = createAdminSupabaseClient();

    const { data: invite } = await admin
      .from("invites")
      .select("id, inviter_id, used")
      .eq("code", code)
      .maybeSingle();

    if (!invite) return err("INVALID_CODE", "유효하지 않은 초대 코드입니다", 400);
    if (invite.used) return err("CODE_USED", "이미 사용된 초대 코드입니다", 400);
    if (invite.inviter_id === userId) return err("SELF_INVITE", "자신의 초대 코드는 사용할 수 없습니다", 400);

    // 코드 사용 처리
    await admin
      .from("invites")
      .update({ used: true, used_at: new Date().toISOString(), invitee_id: userId })
      .eq("id", invite.id);

    // 양쪽 포인트 지급
    await admin.from("point_events").insert([
      { user_id: invite.inviter_id, source: "invite", points: INVITE_BONUS, meta: { code, role: "inviter" } },
      { user_id: userId, source: "invite", points: INVITE_BONUS, meta: { code, role: "invitee" } },
    ]);
    await admin.rpc("increment_total_points", { uid: invite.inviter_id, delta: INVITE_BONUS });
    await admin.rpc("increment_total_points", { uid: userId, delta: INVITE_BONUS });

    return ok({ message: `초대 수락 완료! 양쪽 모두 ${INVITE_BONUS}포인트가 지급되었습니다`, bonusPoints: INVITE_BONUS });
  } catch (e) {
    console.error("[invite/accept]", e);
    return serverError();
  }
}
