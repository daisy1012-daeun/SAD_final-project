"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useVoicePlayer } from "@/hooks/useVoicePlayer";

function VoiceContent() {
  const params = useSearchParams();
  const router = useRouter();
  const script = params.get("script") ?? "";
  const audioUrl = params.get("audioUrl") ?? "";
  const { state, currentTime, duration, play, pause, resume, restart, toggleMute, isMuted } = useVoicePlayer();

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    if (audioUrl) play(audioUrl);
  }, [audioUrl]); // eslint-disable-line

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => { pause(); router.back(); }} className="text-gray-500">←</button>
        <h1 className="text-lg font-bold">음성 안내</h1>
      </header>

      <div className="p-6 space-y-8">
        {/* 음성 안내 아이콘 */}
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-28 h-28 rounded-full bg-green-100 flex items-center justify-center text-5xl transition-transform ${
            state === "playing" ? "animate-pulse" : ""
          }`}>
            {state === "playing" ? "🔊" : state === "paused" ? "⏸" : "🔈"}
          </div>
          <p className="text-sm text-gray-500 capitalize">
            {state === "playing" ? "재생 중" : state === "paused" ? "일시정지" : "준비"}
          </p>
        </div>

        {/* 스크립트 텍스트 */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-sm font-medium text-gray-500 mb-2">안내 내용</p>
          <p className="text-gray-800 leading-relaxed">{script || "음성 안내를 준비 중입니다..."}</p>
        </div>

        {/* 진행 바 */}
        {duration > 0 && (
          <div className="space-y-2">
            <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
        )}

        {/* 컨트롤 버튼 */}
        <div className="flex items-center justify-center gap-6">
          {/* 처음부터 */}
          <button onClick={restart} className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 transition-colors">
            <span className="text-3xl">⏮</span>
            <span className="text-xs">처음부터</span>
          </button>

          {/* 재생/일시정지 */}
          <button
            onClick={() => {
              if (state === "idle") play(audioUrl);
              else if (state === "playing") pause();
              else resume();
            }}
            className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-3xl transition-colors shadow-lg"
          >
            {state === "playing" ? "⏸" : "▶"}
          </button>

          {/* 음소거 */}
          <button onClick={toggleMute} className="flex flex-col items-center gap-1 text-gray-600 hover:text-green-600 transition-colors">
            <span className="text-3xl">{isMuted ? "🔇" : "🔊"}</span>
            <span className="text-xs">{isMuted ? "음소거" : "소리"}</span>
          </button>
        </div>

        <button onClick={() => router.push("/home")} className="btn-secondary w-full">
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default function VoicePage() {
  return <Suspense><VoiceContent /></Suspense>;
}
