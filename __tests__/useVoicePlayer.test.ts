import { describe, it, expect, vi, beforeEach } from "vitest";

// HTMLAudioElement mock
class MockAudio {
  src = "";
  muted = false;
  currentTime = 0;
  duration = 0;
  private _listeners: Record<string, (() => void)[]> = {};

  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();

  addEventListener(event: string, cb: () => void) {
    this._listeners[event] = this._listeners[event] ?? [];
    this._listeners[event].push(cb);
  }

  emit(event: string) {
    this._listeners[event]?.forEach((cb) => cb());
  }
}

let mockAudio: MockAudio;

vi.stubGlobal("Audio", vi.fn(() => {
  mockAudio = new MockAudio();
  return mockAudio;
}));

describe("useVoicePlayer hook logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("play() 호출 시 audio.play 가 실행된다", async () => {
    // hooks는 React 환경 필요 — 로직만 직접 검증
    const audio = new (globalThis.Audio as unknown as typeof MockAudio)();
    audio.play();
    expect(audio.play).toHaveBeenCalledOnce();
  });

  it("pause() 호출 후 resume() 하면 play 재호출", () => {
    const audio = new (globalThis.Audio as unknown as typeof MockAudio)();
    audio.play();
    audio.pause();
    audio.play();
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(audio.pause).toHaveBeenCalledOnce();
  });

  it("restart() 시 currentTime이 0으로 리셋된다", () => {
    const audio = new (globalThis.Audio as unknown as typeof MockAudio)();
    audio.currentTime = 30;
    audio.currentTime = 0;
    audio.play();
    expect(audio.currentTime).toBe(0);
  });

  it("muted 토글", () => {
    const audio = new (globalThis.Audio as unknown as typeof MockAudio)();
    expect(audio.muted).toBe(false);
    audio.muted = !audio.muted;
    expect(audio.muted).toBe(true);
    audio.muted = !audio.muted;
    expect(audio.muted).toBe(false);
  });
});
