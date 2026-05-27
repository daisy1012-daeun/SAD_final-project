"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";

interface PointEvent {
  id: string;
  source: "barcode" | "mission" | "invite" | "bonus";
  points: number;
  meta: Record<string, unknown>;
  created_at: string;
}

const SOURCE_LABELS: Record<string, { label: string; emoji: string }> = {
  barcode: { label: "바코드 스캔", emoji: "📷" },
  mission: { label: "미션 달성", emoji: "🎯" },
  invite: { label: "친구 초대", emoji: "👥" },
  bonus: { label: "보너스", emoji: "🎁" },
};

export default function PointsPage() {
  const [items, setItems] = useState<PointEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

  const fetchPoints = useCallback(async (cursor?: string) => {
    setLoading(true);
    try {
      const url = cursor ? `/api/points?cursor=${encodeURIComponent(cursor)}` : "/api/points";
      const [pointsRes, summaryRes] = await Promise.all([
        fetch(url),
        cursor ? null : fetch("/api/points/summary"),
      ]);
      const data = await pointsRes.json();
      setItems((prev) => cursor ? [...prev, ...(data.items ?? [])] : (data.items ?? []));
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
      if (summaryRes) {
        const summary = await summaryRes.json();
        setTotalPoints(summary.totalPoints ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPoints(); }, [fetchPoints]);

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <AppShell title="포인트 내역">
      <div className="p-4 space-y-4">
        {/* 총 포인트 */}
        <div className="card bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center">
          <p className="text-sm opacity-80">총 누적 포인트</p>
          <p className="text-4xl font-bold mt-1">{totalPoints.toLocaleString()}<span className="text-xl ml-1">pt</span></p>
        </div>

        {/* 내역 목록 */}
        <div className="space-y-2">
          {items.map((item) => {
            const src = SOURCE_LABELS[item.source] ?? { label: item.source, emoji: "💰" };
            return (
              <div key={item.id} className="card flex items-center gap-3">
                <span className="text-2xl">{src.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{src.label}</p>
                  {item.meta?.product !== undefined && item.meta?.product !== null && (
                    <p className="text-xs text-gray-400 truncate">{String(item.meta.product)}</p>
                  )}
                  <p className="text-xs text-gray-400">{fmt(item.created_at)}</p>
                </div>
                <span className="text-green-600 font-bold">+{item.points}</span>
              </div>
            );
          })}
        </div>

        {items.length === 0 && !loading && (
          <p className="text-center text-gray-400 py-8">아직 포인트 내역이 없습니다</p>
        )}

        {hasMore && (
          <button
            onClick={() => fetchPoints(nextCursor ?? undefined)}
            disabled={loading}
            className="btn-secondary w-full"
          >
            {loading ? "불러오는 중..." : "더 보기"}
          </button>
        )}
      </div>
    </AppShell>
  );
}
