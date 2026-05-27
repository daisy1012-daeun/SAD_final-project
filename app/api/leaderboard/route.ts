import { createAdminSupabaseClient, requireAuthUserId } from "@/lib/supabase";
import { ok, unauthorized, serverError } from "@/lib/response";

export async function GET() {
  try {
    try { await requireAuthUserId(); }
    catch { return unauthorized(); }

    const admin = createAdminSupabaseClient();
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // 단과대별 이번 달 포인트 합계 상위 10
    const { data, error } = await admin.rpc("leaderboard_by_college", { month_start: monthStart });
    if (error) {
      // RPC 없을 경우 fallback 쿼리
      const { data: fallback } = await admin
        .from("point_events")
        .select(`
          points,
          users!inner(department_id,
            departments!inner(college_id,
              colleges!inner(id, name)
            )
          )
        `)
        .gte("created_at", monthStart);

      const collegeMap = new Map<string, { name: string; total: number }>();
      for (const row of fallback ?? []) {
        const college = (row as Record<string, unknown>).users as { departments: { colleges: { id: string; name: string } } };
        const { id, name } = college.departments.colleges;
        const prev = collegeMap.get(id) ?? { name, total: 0 };
        collegeMap.set(id, { name, total: prev.total + (row.points as number) });
      }

      const leaderboard = Array.from(collegeMap.entries())
        .map(([id, v]) => ({ college_id: id, college_name: v.name, total_points: v.total }))
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 10)
        .map((item, i) => ({ rank: i + 1, ...item }));

      return ok({ leaderboard, month: monthStart.slice(0, 7) });
    }

    return ok({ leaderboard: (data as unknown[]).slice(0, 10), month: monthStart.slice(0, 7) });
  } catch (e) {
    console.error("[leaderboard]", e);
    return serverError();
  }
}
