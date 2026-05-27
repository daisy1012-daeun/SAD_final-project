"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";

interface Mission {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  progress: number;
  completed: boolean;
  rewardPts: number | null;
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  const fetchMissions = async () => {
    const res = await fetch("/api/missions/today");
    const data = await res.json();
    setMissions(data.missions ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchMissions(); }, []);

  const complete = async (missionId: string) => {
    setCompleting(missionId);
    try {
      const res = await fetch(`/api/missions/${missionId}/complete`, { method: "POST" });
      if (res.ok) await fetchMissions();
    } finally {
      setCompleting(null);
    }
  };

  const completed = missions.filter((m) => m.completed).length;

  return (
    <AppShell title="오늘의 미션">
      <div className="p-4 space-y-4">
        {/* 진행 요약 */}
        <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">오늘 달성</p>
              <p className="text-3xl font-bold text-green-700">{completed} / {missions.length}</p>
            </div>
            <span className="text-5xl">🎯</span>
          </div>
          <div className="mt-3 bg-green-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: missions.length > 0 ? `${(completed / missions.length) * 100}%` : "0%" }}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-8">미션을 불러오는 중...</p>
        ) : (
          <div className="space-y-3">
            {missions.map((m) => (
              <div key={m.id} className={`card ${m.completed ? "opacity-70" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{m.completed ? "✅" : "🎯"}</span>
                  <div className="flex-1">
                    <p className={`font-semibold ${m.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {m.title}
                    </p>
                    {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min((m.progress / m.targetCount) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{m.progress}/{m.targetCount}</span>
                    </div>
                  </div>
                </div>

                {m.completed ? (
                  <div className="mt-3 bg-green-50 rounded-xl p-2 text-center text-sm text-green-600 font-medium">
                    +{m.rewardPts}pt 획득!
                  </div>
                ) : m.progress >= m.targetCount ? (
                  <button
                    onClick={() => complete(m.id)}
                    disabled={completing === m.id}
                    className="btn-primary w-full mt-3 text-sm py-2"
                  >
                    {completing === m.id ? "처리 중..." : "보상 받기"}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
