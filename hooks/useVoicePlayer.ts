"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceState = "idle" | "playing" | "paused";

export interface UseVoicePlayer {
  state: VoiceState;
  currentTime: number;
  duration: number;
  play: (audioUrl: string) => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  toggleMute: () => void;
  isMuted: boolean;
}

export function useVoicePlayer(): UseVoicePlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string>("");
  const [state, setState] = useState<VoiceState>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
      audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
      audio.addEventListener("ended", () => setState("idle"));
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const play = useCallback(
    (audioUrl: string) => {
      const audio = getAudio();
      if (urlRef.current !== audioUrl) {
        audio.src = audioUrl;
        urlRef.current = audioUrl;
        audio.currentTime = 0;
      }
      audio.play().then(() => setState("playing")).catch(console.error);
    },
    [getAudio]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState("paused");
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().then(() => setState("playing")).catch(console.error);
  }, []);

  const restart = useCallback(() => {
    const audio = getAudio();
    audio.currentTime = 0;
    audio.play().then(() => setState("playing")).catch(console.error);
  }, [getAudio]);

  const toggleMute = useCallback(() => {
    const audio = getAudio();
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  }, [getAudio]);

  // 화면 이탈 시 자동 일시정지
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state === "playing") pause();
    };
    const handlePageHide = () => {
      if (state === "playing") pause();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [state, pause]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return { state, currentTime, duration, play, pause, resume, restart, toggleMute, isMuted };
}
