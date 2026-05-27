"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

function InviteContent() {
  const params = useSearchParams();
  const incomingCode = params.get("code");

  const [inviteUrl, setInviteUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [acceptResult, setAcceptResult] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/invite/generate", { method: "POST" });
      const data = await res.json();
      setInviteUrl(data.inviteUrl ?? "");
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: "분리배출 도우미 초대", text: "함께 분리배출하고 포인트 받아요!", url: inviteUrl });
    } else {
      copy();
    }
  };

  const accept = async () => {
    if (!incomingCode) return;
    setAccepting(true);
    setAcceptError("");
    try {
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: incomingCode }),
      });
      const data = await res.json();
      if (!res.ok) { setAcceptError(data.message); return; }
      setAcceptResult(data.message);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <AppShell title="친구 초대">
      <div className="p-4 space-y-6">
        {/* 초대 수락 영역 */}
        {incomingCode && !acceptResult && (
          <div className="card border-green-200 bg-green-50 space-y-3">
            <p className="font-semibold text-green-700">초대를 받으셨나요?</p>
            <p className="text-sm text-gray-600">수락하면 양쪽 모두 500포인트를 받습니다!</p>
            {acceptError && <p className="text-red-500 text-sm">{acceptError}</p>}
            <button onClick={accept} disabled={accepting} className="btn-primary w-full">
              {accepting ? "처리 중..." : "초대 수락하기"}
            </button>
          </div>
        )}

        {acceptResult && (
          <div className="card bg-green-50 border-green-200 text-center">
            <span className="text-4xl">🎉</span>
            <p className="font-bold text-green-700 mt-2">{acceptResult}</p>
          </div>
        )}

        {/* 초대 링크 생성 */}
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <span className="text-5xl">👥</span>
            <h2 className="text-xl font-bold">친구를 초대하세요</h2>
            <p className="text-sm text-gray-500">친구가 초대를 수락하면 양쪽 모두 <strong>500포인트</strong>를 받아요!</p>
          </div>

          {!inviteUrl ? (
            <button onClick={generate} disabled={generating} className="btn-primary w-full">
              {generating ? "생성 중..." : "초대 링크 만들기"}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 break-all border border-gray-200">
                {inviteUrl}
              </div>
              <div className="flex gap-3">
                <button onClick={copy} className="btn-secondary flex-1">
                  {copied ? "✓ 복사됨" : "링크 복사"}
                </button>
                <button onClick={share} className="btn-primary flex-1">공유하기</button>
              </div>
              <button onClick={generate} className="text-sm text-gray-400 w-full text-center">
                새 링크 만들기
              </button>
            </div>
          )}
        </div>

        <div className="card bg-gray-50 space-y-2">
          <h3 className="font-semibold text-sm">초대 방법</h3>
          {["초대 링크를 만들어 친구에게 공유", "친구가 앱에 가입 후 링크 클릭", "양쪽 모두 500포인트 즉시 지급"].map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
              <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                {i + 1}
              </span>
              {step}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default function InvitePage() {
  return <Suspense><InviteContent /></Suspense>;
}
