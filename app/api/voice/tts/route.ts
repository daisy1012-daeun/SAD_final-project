import { NextRequest, NextResponse } from "next/server";
import { requireAuthUserId } from "@/lib/supabase";
import { unauthorized } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    try { await requireAuthUserId(); }
    catch { return unauthorized(); }

    const text = req.nextUrl.searchParams.get("text");
    if (!text) return new NextResponse("text 파라미터가 필요합니다", { status: 400 });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      // 클라이언트 Web Speech API로 fallback 안내
      return new NextResponse(
        JSON.stringify({ fallback: true, text }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ model: "tts-1", voice: "nova", input: text }),
    });

    if (!response.ok) {
      return new NextResponse("TTS 생성에 실패했습니다", { status: 502 });
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("[voice/tts]", e);
    return new NextResponse("서버 오류", { status: 500 });
  }
}
