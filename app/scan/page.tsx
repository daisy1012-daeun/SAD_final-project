"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ScanResult = {
  product: { name: string; material: string };
  checklist: { id: string; label: string; required: boolean }[];
  voice: { script: string; audioUrl: string };
  pointsAwarded: number;
  dailyTotal: number;
  dailyLimit: number;
};

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch {
        setHasPermission(false);
      }
    }

    startCamera();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const submitBarcode = async (barcode: string) => {
    if (!barcode.trim() || scanning) return;
    setScanning(true);
    setError("");
    try {
      const res = await fetch("/api/scan/barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      setResult(data);
    } finally {
      setScanning(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-white p-4 space-y-5">
        <div className="flex items-center gap-3 pt-2">
          <button onClick={() => setResult(null)} className="text-gray-500">←</button>
          <h1 className="text-lg font-bold">스캔 결과</h1>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="font-bold text-green-700">{result.product.name}</p>
              <p className="text-sm text-green-600">{result.product.material} · +{result.pointsAwarded}pt</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-green-600">
            오늘 적립: {result.dailyTotal} / {result.dailyLimit}pt
          </div>
        </div>

        <div className="flex gap-3">
          <Link href={{ pathname: "/scan/checklist", query: { checklist: JSON.stringify(result.checklist) } }} className="btn-primary flex-1 text-center text-sm">
            📋 체크리스트
          </Link>
          <Link
            href={{ pathname: "/scan/voice", query: { script: result.voice.script, audioUrl: result.voice.audioUrl } }}
            className="btn-secondary flex-1 text-center text-sm"
          >
            🔊 음성 안내
          </Link>
        </div>

        <button onClick={() => { setResult(null); setManualBarcode(""); }} className="btn-secondary w-full">
          다시 스캔
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-black flex flex-col">
      {/* 카메라 뷰 */}
      <div className="relative flex-1">
        {hasPermission === false ? (
          <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center text-white p-6 space-y-4">
            <span className="text-5xl">📷</span>
            <p className="text-center">카메라 접근 권한이 없습니다.<br />아래에서 바코드를 직접 입력하세요.</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-40 border-2 border-green-400 rounded-xl" />
            </div>
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <button onClick={() => router.back()} className="bg-black/50 text-white rounded-full p-2 text-sm">← 뒤로</button>
              <Link href="/scan/llm" className="bg-black/50 text-white rounded-full px-3 py-2 text-sm">🤖 AI 분류</Link>
            </div>
          </>
        )}
      </div>

      {/* 하단 입력 영역 */}
      <div className="bg-white p-4 space-y-3">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <div className="flex gap-2">
          <input
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitBarcode(manualBarcode)}
            placeholder="바코드 번호 직접 입력"
            className="input-field flex-1"
          />
          <button
            onClick={() => submitBarcode(manualBarcode)}
            disabled={scanning || !manualBarcode.trim()}
            className="btn-primary px-4 py-2 text-sm"
          >
            {scanning ? "..." : "확인"}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center">카메라를 바코드에 가까이 대거나 번호를 직접 입력하세요</p>
      </div>
    </div>
  );
}
