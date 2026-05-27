"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";

interface LeaderboardEntry {
  rank: number;
  college_name: string;
  total_points: number;
}

interface MyCollege {
  rank: number;
  collegeName: string;
  myPoints: number;
  totalColleges: number;
}

const RANK_BADGES = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myCollege, setMyCollege] = useState<MyCollege | null>(null);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/leaderboard").then((r) => r.json()),
      fetch("/api/leaderboard/my-college").then((r) => r.json()),
    ]).then(([lb, my]) => {
      setLeaderboard(lb.leaderboard ?? []);
      setMonth(lb.month ?? "");
      setMyCollege(my);
      setLoading(false);
    });
  }, []);

  return (
    <AppShell title="단과대 랭킹">
      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-500 text-center">{month} 이달의 분리배출 랭킹</p>

        {/* 내 단과대 순위 */}
        {myCollege && (
          <div className="card bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <p className="text-sm opacity-80">우리 단과대 순위</p>
            <div className="flex items-center justify-between mt-1">
              <div>
                <p className="text-2xl font-bold">{myCollege.rank}위</p>
                <p className="text-sm opacity-80">{myCollege.collegeName}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{myCollege.myPoints.toLocaleString()}pt</p>
                <p className="text-xs opacity-70">전체 {myCollege.totalColleges}개 단과대 중</p>
              </div>
            </div>
          </div>
        )}

        {/* 전체 랭킹 */}
        {loading ? (
          <p className="text-center text-gray-400 py-8">랭킹을 불러오는 중...</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.college_name}
                className={`card flex items-center gap-4 ${entry.rank <= 3 ? "border-yellow-200 bg-yellow-50" : ""}`}
              >
                <div className="w-10 text-center">
                  {entry.rank <= 3 ? (
                    <span className="text-2xl">{RANK_BADGES[entry.rank - 1]}</span>
                  ) : (
                    <span className="text-lg font-bold text-gray-400">{entry.rank}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{entry.college_name}</p>
                </div>
                <p className="font-bold text-green-600">{entry.total_points.toLocaleString()}pt</p>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <p className="text-center text-gray-400 py-8">이번 달 데이터가 없습니다</p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
