export const DAILY_LIMIT = 100;
export const BARCODE_POINT = 1;
export const INVITE_BONUS = 500;
export const MISSION_RANDOM_POOL = [1, 3, 5, 10] as const;

export function randomMissionPoints(): number {
  return MISSION_RANDOM_POOL[
    Math.floor(Math.random() * MISSION_RANDOM_POOL.length)
  ];
}

export function canEarnPoints(earnedToday: number, toAdd: number): boolean {
  return earnedToday + toAdd <= DAILY_LIMIT;
}

export function clampPoints(earnedToday: number, toAdd: number): number {
  const remaining = DAILY_LIMIT - earnedToday;
  return Math.max(0, Math.min(toAdd, remaining));
}
