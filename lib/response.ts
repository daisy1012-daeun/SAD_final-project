import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: code, message }, { status });
}

export function unauthorized() {
  return err("UNAUTHORIZED", "로그인이 필요합니다", 401);
}

export function forbidden() {
  return err("FORBIDDEN", "권한이 없습니다", 403);
}

export function notFound(message = "리소스를 찾을 수 없습니다") {
  return err("NOT_FOUND", message, 404);
}

export function badRequest(message: string) {
  return err("BAD_REQUEST", message, 400);
}

export function serverError(message = "서버 오류가 발생했습니다") {
  return err("SERVER_ERROR", message, 500);
}
