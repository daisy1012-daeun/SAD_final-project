import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient, requireAuthUserId } from "@/lib/supabase";
import { ok, badRequest, unauthorized, serverError } from "@/lib/response";

const ProfileSchema = z.object({
  departmentId: z.string().uuid(),
});

export async function PATCH(req: NextRequest) {
  try {
    let userId: string;
    try { userId = await requireAuthUserId(); }
    catch { return unauthorized(); }

    const body = await req.json();
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("users")
      .update({ department_id: parsed.data.departmentId })
      .eq("id", userId);

    if (error) return serverError("프로필 업데이트에 실패했습니다");
    return ok({ message: "소속이 업데이트되었습니다" });
  } catch (e) {
    console.error("[profile patch]", e);
    return serverError();
  }
}
