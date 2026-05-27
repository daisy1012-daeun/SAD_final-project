"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface School { id: string; name: string }
interface College { id: string; name: string; school_id: string }
interface Department { id: string; name: string; college_id: string }

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    studentId: "",
    email: "",
    password: "",
    name: "",
    schoolId: "",
    collegeId: "",
    departmentId: "",
  });

  const [schools, setSchools] = useState<School[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    fetch("/api/org/schools").then((r) => r.json()).then((d) => setSchools(d.schools ?? []));
  }, []);

  useEffect(() => {
    if (!form.schoolId) return;
    fetch(`/api/org/colleges?schoolId=${form.schoolId}`).then((r) => r.json()).then((d) => setColleges(d.colleges ?? []));
    setForm((f) => ({ ...f, collegeId: "", departmentId: "" }));
  }, [form.schoolId]);

  useEffect(() => {
    if (!form.collegeId) return;
    fetch(`/api/org/departments?collegeId=${form.collegeId}`).then((r) => r.json()).then((d) => setDepartments(d.departments ?? []));
    setForm((f) => ({ ...f, departmentId: "" }));
  }, [form.collegeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const validateStep1 = () => {
    if (!/^[0-9]{7,10}$/.test(form.studentId)) return "학번은 7~10자리 숫자입니다";
    if (!form.email.includes("@")) return "올바른 이메일을 입력하세요";
    if (form.password.length < 8) return "비밀번호는 8자 이상이어야 합니다";
    if (!form.name.trim()) return "이름을 입력하세요";
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.departmentId) { setError("학과를 선택하세요"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: form.studentId,
          email: form.email,
          password: form.password,
          name: form.name,
          departmentId: form.departmentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      router.push("/auth/login?signup=success");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">♻️</div>
          <h1 className="text-2xl font-bold">회원가입</h1>
          <p className="text-sm text-gray-500 mt-1">{step === 1 ? "기본 정보 입력" : "소속 선택"}</p>
        </div>

        {/* 진행 표시 */}
        <div className="flex gap-2">
          {[1, 2].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? "bg-green-500" : "bg-gray-200"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학번</label>
              <input name="studentId" value={form.studentId} onChange={handleChange} placeholder="2024XXXXXXX" className="input-field" maxLength={10} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="홍길동" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="student@university.ac.kr" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 (8자 이상)</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" className="input-field" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleNext} className="btn-primary w-full">다음</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학교</label>
              <select name="schoolId" value={form.schoolId} onChange={handleChange} className="input-field">
                <option value="">학교 선택</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">단과대</label>
              <select name="collegeId" value={form.collegeId} onChange={handleChange} className="input-field" disabled={!form.schoolId}>
                <option value="">단과대 선택</option>
                {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학과</label>
              <select name="departmentId" value={form.departmentId} onChange={handleChange} className="input-field" disabled={!form.collegeId}>
                <option value="">학과 선택</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">이전</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? "처리 중..." : "가입하기"}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/login" className="text-green-600 font-medium">로그인</Link>
        </p>
      </div>
    </div>
  );
}
