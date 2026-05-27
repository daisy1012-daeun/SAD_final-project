import { createAdminSupabaseClient, requireAuthUserId } from "@/lib/supabase";
import { ok, unauthorized, serverError } from "@/lib/response";
import { DAILY_LIMIT } from "@/lib/points";

export async function GET() {
  try {
    let userId: string;
    try { userId = await requireAuthUserId(); }
    catch { return unauthorized(); }

    const admin = createAdminSupabaseClient();
    const today = new Date().toISOString().slice(0, 10);

    const [capResult, userResult] = await Promise.all([
      admin.from("daily_point_caps").select("earned").eq("user_id", userId).eq("date", today).maybeSingle(),
      admin.from("users").select("total_points").eq("id", userId).single(),
    ]);

    return ok({
      todayEarned: capResult.data?.earned ?? 0,
      dailyLimit: DAILY_LIMIT,
      totalPoints: userResult.data?.total_points ?? 0,
    });
  } catch (e) {
    console.error("[points/summary]", e);
    return serverError();
  }
}
