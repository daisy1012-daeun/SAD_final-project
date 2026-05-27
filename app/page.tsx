import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-sm w-full">
        <div className="text-7xl">♻️</div>
        <h1 className="text-3xl font-bold text-green-700">분리배출 도우미</h1>
        <p className="text-gray-500 leading-relaxed">
          바코드 스캔으로 올바른 분리배출 방법을 확인하고<br />
          포인트를 적립해 단과대 랭킹에 도전하세요
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { emoji: "📷", text: "바코드 스캔" },
            { emoji: "🎯", text: "미션 달성" },
            { emoji: "🏆", text: "단과대 경쟁" },
            { emoji: "🔊", text: "음성 안내" },
          ].map((f) => (
            <div key={f.text} className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
              <span className="text-2xl">{f.emoji}</span>
              <span className="font-medium text-green-800">{f.text}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <Link href="/auth/signup" className="btn-primary w-full block text-center">
            시작하기
          </Link>
          <Link href="/auth/login" className="btn-secondary w-full block text-center">
            이미 계정이 있어요
          </Link>
        </div>
      </div>
    </div>
  );
}
