import { createServerSupabaseClient } from "@/lib/supabase";
import { ok, serverError } from "@/lib/response";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    return ok({ message: "로그아웃 되었습니다" });
  } catch (e) {
    console.error("[logout]", e);
    return serverError();
  }
}
