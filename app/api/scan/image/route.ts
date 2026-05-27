import { NextRequest } from "next/server";
import { requireAuthUserId } from "@/lib/supabase";
import { unauthorized } from "@/lib/response";
import { ok, serverError, badRequest } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    try { await requireAuthUserId(); }
    catch { return unauthorized(); }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) return badRequest("이미지 파일이 필요합니다");

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return ok({
        result: {
          category: "플라스틱",
          disposalMethod: "플라스틱류로 분리배출 해주세요.",
          checklist: [
            { id: "c1", label: "내용물을 비웠나요?", required: true },
            { id: "c2", label: "라벨을 제거했나요?", required: true },
          ],
        },
        note: "OpenAI API 키가 설정되지 않아 기본 안내를 제공합니다",
      });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
        signal: controller.signal,
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "이 사진에 있는 물건의 분리배출 방법을 한국어로 알려주세요. JSON 형식으로: {\"category\": \"재질\", \"disposalMethod\": \"배출방법\", \"checklist\": [{\"id\": \"c1\", \"label\": \"체크항목\", \"required\": true}]}",
                },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
              ],
            },
          ],
          max_tokens: 500,
        }),
      });

      clearTimeout(timeout);
      const json = await response.json();
      const content = json.choices?.[0]?.message?.content ?? "";

      let result;
      try {
        result = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
      } catch {
        result = { category: "알 수 없음", disposalMethod: content, checklist: [] };
      }

      return ok({ result });
    } catch (e: unknown) {
      clearTimeout(timeout);
      if (e instanceof Error && e.name === "AbortError") {
        return serverError("LLM 응답 시간이 초과되었습니다. 다시 시도해주세요");
      }
      throw e;
    }
  } catch (e) {
    console.error("[scan/image]", e);
    return serverError();
  }
}
