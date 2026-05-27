"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface LLMResult {
  category: string;
  disposalMethod: string;
  checklist: { id: string; label: string; required: boolean }[];
}

export default function LLMScanPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LLMResult | null>(null);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const analyze = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/scan/image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "분석에 실패했습니다"); return; }
      setResult(data.result);
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const retry = () => { setRetryCount((c) => c + 1); analyze(); };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">←</button>
        <h1 className="text-lg font-bold">AI 분류 도우미</h1>
      </header>

      <div className="p-4 space-y-5">
        <p className="text-sm text-gray-500">바코드가 없는 품목은 사진을 찍어 AI에게 물어보세요</p>

        {/* 이미지 선택 */}
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-green-400 transition-colors"
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-full max-h-48 object-contain rounded-xl" />
          ) : (
            <>
              <span className="text-5xl">📸</span>
              <p className="text-gray-500 text-sm">탭하여 사진 선택</p>
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

        {preview && !result && (
          <button onClick={analyze} disabled={loading} className="btn-primary w-full">
            {loading ? "AI 분석 중..." : "🤖 분류 요청"}
          </button>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={retry} className="text-red-600 font-medium text-sm ml-3">재시도</button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="card bg-green-50 border-green-200">
              <p className="font-bold text-green-700 text-lg">{result.category}</p>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">{result.disposalMethod}</p>
            </div>

            {result.checklist.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">전처리 체크리스트</h3>
                {result.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm">{item.label}</span>
                    {item.required && <span className="text-xs text-red-500 ml-auto">필수</span>}
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => { setPreview(null); setResult(null); if (fileRef.current) fileRef.current.value = ""; }} className="btn-secondary w-full">
              다른 품목 분류
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
