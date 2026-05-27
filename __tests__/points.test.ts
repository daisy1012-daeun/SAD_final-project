import { describe, it, expect } from "vitest";
import { canEarnPoints, clampPoints, randomMissionPoints, DAILY_LIMIT, MISSION_RANDOM_POOL } from "@/lib/points";

describe("lib/points", () => {
  it("한도 미달 시 canEarnPoints = true", () => {
    expect(canEarnPoints(50, 1)).toBe(true);
  });

  it("한도 정확히 도달 시 canEarnPoints = true", () => {
    expect(canEarnPoints(99, 1)).toBe(true);
  });

  it("한도 초과 시 canEarnPoints = false", () => {
    expect(canEarnPoints(100, 1)).toBe(false);
  });

  it("clampPoints: 남은 한도 내에서 정상 반환", () => {
    expect(clampPoints(90, 5)).toBe(5);
  });

  it("clampPoints: 초과 시 남은 한도만 반환", () => {
    expect(clampPoints(95, 10)).toBe(5);
  });

  it("clampPoints: 이미 한도 초과 시 0 반환", () => {
    expect(clampPoints(100, 1)).toBe(0);
  });

  it("randomMissionPoints는 풀 안의 값만 반환", () => {
    for (let i = 0; i < 100; i++) {
      expect(MISSION_RANDOM_POOL).toContain(randomMissionPoints());
    }
  });

  it("DAILY_LIMIT은 100", () => {
    expect(DAILY_LIMIT).toBe(100);
  });
});
