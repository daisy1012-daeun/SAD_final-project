import { NextRequest } from "next/server";
import { createAdminSupabaseClient, requireAuthUserId } from "@/lib/supabase";
import { ok, unauthorized, serverError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    let userId: string;
    try { userId = await requireAuthUserId(); }
    catch { return unauthorized(); }

    const cursor = req.nextUrl.searchParams.get("cursor");
    const limit = 20;
    const admin = createAdminSupabaseClient();

    let query = admin
      .from("point_events")
      .select("id, source, points, meta, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) query = query.lt("created_at", cursor);

    const { data, error } = await query;
    if (error) return serverError();

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore ? items[items.length - 1].created_at : null;

    return ok({ items, nextCursor, hasMore });
  } catch (e) {
    console.error("[points]", e);
    return serverError();
  }
}
