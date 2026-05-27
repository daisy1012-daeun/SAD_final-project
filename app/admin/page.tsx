"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";

interface Mission { id: string; title: string; description: string; target_count: number; is_active: boolean }

export default function AdminPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", target_count: "1" });
  const [saving, setSaving] = useState(false);

  const fetchMissions = async () => {
    const res = await fetch("/api/admin/missions");
    const data = await res.json();
    if (res.ok) setMissions(data.missions ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchMissions(); }, []);

  const createMission = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/admin/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, target_count: Number(form.target_count) }),
      });
      setForm({ title: "", description: "", target_count: "1" });
      await fetchMissions();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/missions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    await fetchMissions();
  };

  return (
    <AppShell title="관리자 패널">
      <div className="p-4 space-y-6">
        <div className="card border-yellow-200 bg-yellow-50">
          <p className="text-sm text-yellow-700 font-medium">⚠️ 관리자 전용 페이지입니다</p>
        </div>

        {/* 미션 생성 */}
        <div className="card space-y-4">
          <h2 className="font-bold">미션 추가</h2>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="미션 제목"
            className="input-field"
          />
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="미션 설명"
            className="input-field"
          />
          <div className="flex gap-3 items-center">
            <label className="text-sm text-gray-600 whitespace-nowrap">목표 횟수</label>
            <input
              type="number"
              min="1"
              value={form.target_count}
              onChange={(e) => setForm((f) => ({ ...f, target_count: e.target.value }))}
              className="input-field"
            />
          </div>
          <button onClick={createMission} disabled={saving || !form.title.trim()} className="btn-primary w-full">
            {saving ? "저장 중..." : "미션 추가"}
          </button>
        </div>

        {/* 미션 목록 */}
        <div className="space-y-3">
          <h2 className="font-bold">미션 목록</h2>
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-4">불러오는 중...</p>
          ) : (
            missions.map((m) => (
              <div key={m.id} className={`card ${!m.is_active ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{m.title}</p>
                    {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">목표: {m.target_count}회</p>
                  </div>
                  <button
                    onClick={() => toggleActive(m.id, m.is_active)}
                    className={`text-xs px-3 py-1 rounded-full font-medium ${m.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {m.is_active ? "활성" : "비활성"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
