import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient, requireAuthUserId } from "@/lib/supabase";
import { ok, badRequest, forbidden, unauthorized, serverError } from "@/lib/response";

async function requireAdmin(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from("users").select("is_admin").eq("id", userId).single();
  return data?.is_admin === true;
}

export async function GET() {
  try {
    let userId: string;
    try { userId = await requireAuthUserId(); }
    catch { return unauthorized(); }
    if (!(await requireAdmin(userId))) return forbidden();

    const admin = createAdminSupabaseClient();
    const { data } = await admin.from("missions").select("*").order("created_at", { ascending: false });
    return ok({ missions: data ?? [] });
  } catch (e) {
    console.error("[admin/missions GET]", e);
    return serverError();
  }
}

const CreateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  target_count: z.number().int().min(1),
});

export async function POST(req: NextRequest) {
  try {
    let userId: string;
    try { userId = await requireAuthUserId(); }
    catch { return unauthorized(); }
    if (!(await requireAdmin(userId))) return forbidden();

    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.from("missions").insert(parsed.data).select().single();
    if (error) return serverError();
    return ok({ mission: data }, 201);
  } catch (e) {
    console.error("[admin/missions POST]", e);
    return serverError();
  }
}
