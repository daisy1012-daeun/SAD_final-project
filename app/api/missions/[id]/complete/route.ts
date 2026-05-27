import { NextRequest } from "next/server";
import { createAdminSupabaseClient, requireAuthUserId } from "@/lib/supabase";
import { randomMissionPoints, DAILY_LIMIT } from "@/lib/points";
import { ok, unauthorized, err, serverError } from "@/lib/response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId: string;
    try { userId = await requireAuthUserId(); }
    catch { return unauthorized(); }

    const { id: missionId } = await params;
    const admin = createAdminSupabaseClient();
    const today = new Date().toISOString().slice(0, 10);

    // 미션 존재 확인
    const { data: mission } = await admin
      .from("missions")
      .select("id, title, target_count")
      .eq("id", missionId)
      .eq("is_active", true)
      .maybeSingle();
    if (!mission) return err("MISSION_NOT_FOUND", "미션을 찾을 수 없습니다", 404);

    // 이미 완료 확인
    const { data: existing } = await admin
      .from("user_missions")
      .select("id, completed, progress")
      .eq("user_id", userId)
      .eq("mission_id", missionId)
      .eq("date", today)
      .maybeSingle();

    if (existing?.completed) {
      return err("ALREADY_COMPLETED", "오늘 이미 완료한 미션입니다", 409);
    }

    const rewardPts = randomMissionPoints();

    // upsert user_missions
    const { error: upsertError } = await admin.from("user_missions").upsert(
      {
        user_id: userId,
        mission_id: missionId,
        date: today,
        progress: mission.target_count,
        completed: true,
        reward_pts: rewardPts,
      },
      { onConflict: "user_id,mission_id,date" }
    );
    if (upsertError) return serverError("미션 완료 저장에 실패했습니다");

    // 포인트 지급
    await admin.from("point_events").insert({
      user_id: userId,
      source: "mission",
      points: rewardPts,
      meta: { mission_id: missionId, mission_title: mission.title },
    });
    await admin.rpc("increment_total_points", { uid: userId, delta: rewardPts });

    return ok({ rewardPts, message: `미션 완료! ${rewardPts}포인트를 획득했습니다` });
  } catch (e) {
    console.error("[missions/complete]", e);
    return serverError();
  }
}
