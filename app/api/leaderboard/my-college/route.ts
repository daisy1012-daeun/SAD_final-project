import { createAdminSupabaseClient, requireAuthUserId } from "@/lib/supabase";
import { ok, unauthorized, serverError } from "@/lib/response";

export async function GET() {
  try {
    let userId: string;
    try { userId = await requireAuthUserId(); }
    catch { return unauthorized(); }

    const admin = createAdminSupabaseClient();

    // 내 단과대 조회
    const { data: user } = await admin
      .from("users")
      .select("departments!inner(college_id, colleges!inner(id, name))")
      .eq("id", userId)
      .single();

    if (!user) return serverError("사용자 정보를 찾을 수 없습니다");

    const dept = user.departments as unknown as { college_id: string; colleges: { id: string; name: string } };
    const collegeId = dept?.college_id;
    const collegeName = dept?.colleges?.name;

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // 전체 리더보드에서 내 단과대 순위 계산
    const { data: allColleges } = await admin
      .from("users")
      .select(`
        department_id,
        departments!inner(college_id),
        point_events(points, created_at)
      `)
      .gte("point_events.created_at", monthStart);

    const collegeMap = new Map<string, number>();
    for (const u of allColleges ?? []) {
      const cid = (u.departments as unknown as { college_id: string })?.college_id;
      if (!cid) continue;
      const pts = (u.point_events as { points: number }[])?.reduce((s, e) => s + e.points, 0) ?? 0;
      collegeMap.set(cid, (collegeMap.get(cid) ?? 0) + pts);
    }

    const sorted = Array.from(collegeMap.entries()).sort((a, b) => b[1] - a[1]);
    const rank = sorted.findIndex(([id]) => id === collegeId) + 1;
    const myPoints = collegeMap.get(collegeId) ?? 0;

    return ok({ rank, collegeName, myPoints, totalColleges: sorted.length });
  } catch (e) {
    console.error("[leaderboard/my-college]", e);
    return serverError();
  }
}
