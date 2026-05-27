import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { ok, badRequest, serverError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const collegeId = req.nextUrl.searchParams.get("collegeId");
    if (!collegeId) return badRequest("collegeId가 필요합니다");

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("departments")
      .select("id, name, college_id")
      .eq("college_id", collegeId)
      .order("name");
    if (error) return serverError();
    return ok({ departments: data });
  } catch (e) {
    console.error("[org/departments]", e);
    return serverError();
  }
}
