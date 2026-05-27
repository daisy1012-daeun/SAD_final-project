import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { ok, badRequest, serverError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    if (!schoolId) return badRequest("schoolId가 필요합니다");

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("colleges")
      .select("id, name, school_id")
      .eq("school_id", schoolId)
      .order("name");
    if (error) return serverError();
    return ok({ colleges: data });
  } catch (e) {
    console.error("[org/colleges]", e);
    return serverError();
  }
}
