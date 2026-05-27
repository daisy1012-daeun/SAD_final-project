"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/home", label: "홈", icon: "🏠" },
  { href: "/scan", label: "스캔", icon: "📷" },
  { href: "/missions", label: "미션", icon: "🎯" },
  { href: "/leaderboard", label: "랭킹", icon: "🏆" },
  { href: "/profile", label: "내 정보", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-tab flex-1 py-3 ${active ? "text-green-600" : "text-gray-400"}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
