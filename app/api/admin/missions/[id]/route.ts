import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient, requireAuthUserId } from "@/lib/supabase";
import { ok, badRequest, forbidden, unauthorized, serverError } from "@/lib/response";

async function requireAdmin(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from("users").select("is_admin").eq("id", userId).single();
  return data?.is_admin === true;
}

const PatchSchema = z.object({ is_active: z.boolean() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId: string;
    try { userId = await requireAuthUserId(); }
    catch { return unauthorized(); }
    if (!(await requireAdmin(userId))) return forbidden();

    const { id } = await params;
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("missions").update(parsed.data).eq("id", id);
    if (error) return serverError();
    return ok({ message: "업데이트 완료" });
  } catch (e) {
    console.error("[admin/missions PATCH]", e);
    return serverError();
  }
}
