"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface College { id: string; name: string }
interface Department { id: string; name: string }

export default function SettingsPage() {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [collegeId, setCollegeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/org/colleges?schoolId=00000000-0000-0000-0000-000000000001")
      .then((r) => r.json())
      .then((d) => setColleges(d.colleges ?? []));
  }, []);

  useEffect(() => {
    if (!collegeId) return;
    fetch(`/api/org/departments?collegeId=${collegeId}`)
      .then((r) => r.json())
      .then((d) => setDepartments(d.departments ?? []));
    setDepartmentId("");
  }, [collegeId]);

  const save = async () => {
    if (!departmentId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => router.push("/profile"), 1000); }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">←</button>
        <h1 className="text-lg font-bold">설정</h1>
      </header>

      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <h2 className="font-semibold">소속 변경</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">단과대</label>
            <select value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="input-field">
              <option value="">단과대 선택</option>
              {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">학과</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="input-field" disabled={!collegeId}>
              <option value="">학과 선택</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <button onClick={save} disabled={!departmentId || saving} className="btn-primary w-full">
            {saved ? "✓ 저장됨" : saving ? "저장 중..." : "변경 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
