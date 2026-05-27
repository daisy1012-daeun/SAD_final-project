import { createAdminSupabaseClient } from "@/lib/supabase";
import { ok, serverError } from "@/lib/response";

export async function GET() {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.from("schools").select("id, name").order("name");
    if (error) return serverError();
    return ok({ schools: data });
  } catch (e) {
    console.error("[org/schools]", e);
    return serverError();
  }
}
