"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface CheckItem { id: string; label: string; required: boolean }

function ChecklistContent() {
  const params = useSearchParams();
  const router = useRouter();
  const items: CheckItem[] = JSON.parse(params.get("checklist") ?? "[]");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const requiredAll = items.filter((i) => i.required).every((i) => checked.has(i.id));

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">←</button>
        <h1 className="text-lg font-bold">전처리 체크리스트</h1>
      </header>

      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-500">배출 전 아래 항목을 확인해주세요</p>

        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                checked.has(item.id)
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                checked.has(item.id) ? "border-green-500 bg-green-500" : "border-gray-300"
              }`}>
                {checked.has(item.id) && <span className="text-white text-xs">✓</span>}
              </div>
              <div>
                <p className="font-medium text-gray-800">{item.label}</p>
                {item.required && <p className="text-xs text-red-500 mt-0.5">필수</p>}
              </div>
            </button>
          ))}
        </div>

        {items.length === 0 && (
          <p className="text-center text-gray-400 py-8">체크리스트 항목이 없습니다</p>
        )}

        <div className="pt-4 space-y-3">
          <div className={`p-4 rounded-xl text-sm ${requiredAll ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
            {requiredAll
              ? "✅ 필수 항목을 모두 확인했습니다. 분리배출 준비 완료!"
              : "⚠️ 필수 항목을 모두 확인해주세요"}
          </div>
          <button onClick={() => router.push("/home")} className="btn-primary w-full">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChecklistPage() {
  return <Suspense><ChecklistContent /></Suspense>;
}
