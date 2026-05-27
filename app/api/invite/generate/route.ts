import { createAdminSupabaseClient, requireAuthUserId } from "@/lib/supabase";
import { ok, unauthorized, serverError } from "@/lib/response";
import { randomBytes } from "crypto";

export async function POST() {
  try {
    let userId: string;
    try { userId = await requireAuthUserId(); }
    catch { return unauthorized(); }

    const code = randomBytes(8).toString("hex");
    const admin = createAdminSupabaseClient();

    const { error } = await admin.from("invites").insert({ inviter_id: userId, code });
    if (error) return serverError("초대 코드 생성에 실패했습니다");

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    return ok({ code, inviteUrl: `${baseUrl}/invite?code=${code}` }, 201);
  } catch (e) {
    console.error("[invite/generate]", e);
    return serverError();
  }
}
