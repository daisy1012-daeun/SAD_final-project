import { NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase";
import { ok, badRequest, err, serverError } from "@/lib/response";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const { email, password } = parsed.data;
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return err("INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다", 401);

    return ok({
      user: { id: data.user.id, email: data.user.email },
      session: { accessToken: data.session?.access_token, expiresAt: data.session?.expires_at },
    });
  } catch (e) {
    console.error("[login]", e);
    return serverError();
  }
}
