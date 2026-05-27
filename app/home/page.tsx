"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";

interface Summary { todayEarned: number; dailyLimit: number; totalPoints: number }
interface Mission { id: string; title: string; completed: boolean; progress: number; targetCount: number }

export default function HomePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/points/summary").then((r) => r.json()),
      fetch("/api/missions/today").then((r) => r.json()),
    ]).then(([s, m]) => {
      setSummary(s);
      setMissions((m.missions ?? []).slice(0, 3));
    });
  }, []);

  const progress = summary ? (summary.todayEarned / summary.dailyLimit) * 100 : 0;

  return (
    <AppShell>
      <div className="p-4 space-y-5">
        {/* 포인트 요약 카드 */}
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <p className="text-sm opacity-80">오늘 적립 포인트</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-4xl font-bold">{summary?.todayEarned ?? 0}</span>
            <span className="text-lg opacity-70">/ {summary?.dailyLimit ?? 100}pt</span>
          </div>
          <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
            <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs opacity-70 mt-2">총 누적 포인트: {summary?.totalPoints ?? 0}pt</p>
        </div>

        {/* 스캔 버튼 */}
        <Link href="/scan" className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4">
          <span>📷</span> 바코드 스캔하기
        </Link>

        {/* 오늘의 미션 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">오늘의 미션</h2>
            <Link href="/missions" className="text-sm text-green-600">전체 보기</Link>
          </div>
          <div className="space-y-3">
            {missions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">미션을 불러오는 중...</p>
            ) : (
              missions.map((m) => (
                <div key={m.id} className="card flex items-center gap-3">
                  <span className="text-2xl">{m.completed ? "✅" : "🎯"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${m.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {m.title}
                    </p>
                    <p className="text-xs text-gray-400">{m.progress} / {m.targetCount}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/leaderboard", emoji: "🏆", label: "단과대 랭킹" },
            { href: "/points", emoji: "💰", label: "포인트 내역" },
            { href: "/invite", emoji: "👥", label: "친구 초대" },
            { href: "/scan/llm", emoji: "🤖", label: "AI 분류" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="card flex items-center gap-3 hover:bg-gray-50 transition-colors">
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
