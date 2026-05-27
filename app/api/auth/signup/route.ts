import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";
import { encrypt, hashForSearch } from "@/lib/crypto";
import { ok, badRequest, serverError, err } from "@/lib/response";

const SignupSchema = z.object({
  studentId: z.string().regex(/^[0-9]{7,10}$/, "학번은 7~10자리 숫자입니다"),
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  name: z.string().min(1).max(50),
  departmentId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }
    const { studentId, email, password, name, departmentId } = parsed.data;

    const admin = createAdminSupabaseClient();

    // 학번 중복 확인
    const studentIdHash = hashForSearch(studentId);
    const { data: existingStudent } = await admin
      .from("users")
      .select("id")
      .eq("student_id_hash", studentIdHash)
      .maybeSingle();
    if (existingStudent) {
      return err("STUDENT_ID_TAKEN", "이미 등록된 학번입니다", 409);
    }

    // 이메일 중복 확인
    const emailHash = hashForSearch(email.toLowerCase());
    const { data: existingEmail } = await admin
      .from("users")
      .select("id")
      .eq("email_hash", emailHash)
      .maybeSingle();
    if (existingEmail) {
      return err("EMAIL_TAKEN", "이미 사용 중인 이메일입니다", 409);
    }

    // Supabase Auth 회원가입
    const supabase = await createServerSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError || !authData.user) {
      return serverError(authError?.message ?? "회원가입에 실패했습니다");
    }

    // users 테이블에 암호화 저장
    const { error: insertError } = await admin.from("users").insert({
      id: authData.user.id,
      student_id_hash: studentIdHash,
      student_id_enc: encrypt(studentId),
      email_hash: emailHash,
      email_enc: encrypt(email.toLowerCase()),
      name_enc: encrypt(name),
      department_id: departmentId,
    });

    if (insertError) {
      // Auth 계정 롤백
      await admin.auth.admin.deleteUser(authData.user.id);
      return serverError("사용자 정보 저장에 실패했습니다");
    }

    return ok({ message: "회원가입이 완료되었습니다" }, 201);
  } catch (e) {
    console.error("[signup]", e);
    return serverError();
  }
}
