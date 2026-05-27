import { createAdminSupabaseClient, requireAuthUserId } from "@/lib/supabase";
import { ok, unauthorized, serverError } from "@/lib/response";

export async function GET() {
  try {
    let userId: string;
    try { userId = await requireAuthUserId(); }
    catch { return unauthorized(); }

    const admin = createAdminSupabaseClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data: missions, error } = await admin
      .from("missions")
      .select("id, title, description, target_count")
      .eq("is_active", true);

    if (error) return serverError();

    // 오늘 달성 현황 조회
    const { data: userMissions } = await admin
      .from("user_missions")
      .select("mission_id, progress, completed, reward_pts")
      .eq("user_id", userId)
      .eq("date", today);

    const progressMap = new Map(userMissions?.map((um) => [um.mission_id, um]) ?? []);

    const result = missions.map((m) => {
      const um = progressMap.get(m.id);
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        targetCount: m.target_count,
        progress: um?.progress ?? 0,
        completed: um?.completed ?? false,
        rewardPts: um?.reward_pts ?? null,
      };
    });

    return ok({ missions: result, date: today });
  } catch (e) {
    console.error("[missions/today]", e);
    return serverError();
  }
}
