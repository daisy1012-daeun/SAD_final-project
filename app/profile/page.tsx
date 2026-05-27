"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

interface ProfileData {
  studentIdMasked: string;
  departmentName: string;
  collegeName: string;
  totalPoints: number;
  todayEarned: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    // 포인트 요약만 우선 표시
    fetch("/api/points/summary").then((r) => r.json()).then((data) => {
      setProfile((prev) => prev
        ? { ...prev, totalPoints: data.totalPoints, todayEarned: data.todayEarned }
        : { studentIdMasked: "2024*****", departmentName: "-", collegeName: "-", totalPoints: data.totalPoints, todayEarned: data.todayEarned }
      );
    });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <AppShell title="내 정보">
      <div className="p-4 space-y-5">
        {/* 프로필 카드 */}
        <div className="card text-center space-y-3">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto">
            👤
          </div>
          <div>
            <p className="text-sm text-gray-500">학번</p>
            <p className="font-bold text-gray-800">{profile?.studentIdMasked ?? "2024*****"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">소속</p>
            <p className="font-medium text-gray-700">
              {profile?.collegeName && profile.collegeName !== "-" ? `${profile.collegeName} · ` : ""}
              {profile?.departmentName ?? "-"}
            </p>
          </div>
        </div>

        {/* 포인트 요약 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <p className="text-xs text-gray-500">오늘 적립</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{profile?.todayEarned ?? 0}</p>
            <p className="text-xs text-gray-400">pt</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500">총 누적</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{profile?.totalPoints ?? 0}</p>
            <p className="text-xs text-gray-400">pt</p>
          </div>
        </div>

        {/* 메뉴 목록 */}
        <div className="card divide-y divide-gray-100 p-0 overflow-hidden">
          {[
            { href: "/points", label: "포인트 내역", emoji: "💰" },
            { href: "/invite", label: "친구 초대", emoji: "👥" },
            { href: "/profile/settings", label: "설정", emoji: "⚙️" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
              <span className="text-xl">{item.emoji}</span>
              <span className="text-sm font-medium flex-1">{item.label}</span>
              <span className="text-gray-300">›</span>
            </Link>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 text-red-500 font-medium text-sm border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </AppShell>
  );
}
