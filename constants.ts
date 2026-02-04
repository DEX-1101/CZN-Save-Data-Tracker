
export const DEFAULT_POINTS = {
  NEUTRAL_CARD: 20,
  MONSTER_CARD_NORMAL: 20,
  MONSTER_CARD_RARE: 50,
  MONSTER_CARD_LEGENDARY: 80,
  DIVINE_EPIPHANY: 20,
  FORBIDDEN_CARD: 20,
  STARTING_CARD_REMOVED: 20,
  GODS_HAMMER: 10,
};

export const calculateDuplicationPoints = (count: number): number => {
  // Rule: 0+0+40+40 (max 4 duplicates)
  // 1 -> 0
  // 2 -> 0
  // 3 -> 40
  // 4 -> 80
  if (count <= 2) return 0;
  if (count === 3) return 40;
  return 80;
};

export const calculateTierLimit = (tier: number): number => {
  return 20 + tier * 10;
};

export const TIER_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 1);
