export const DEFAULT_POINTS = {
  NEUTRAL_CARD: 20,
  MONSTER_CARD: 80,
  CARD_CONVERSION: 10,
  NORMAL_EPIPHANY: 10,
  DIVINE_EPIPHANY: 20,
  FORBIDDEN_CARD: 20,
  CHARACTER_CARD: 20,
  SPECIAL_ACTION_INITIAL_INCREMENT: 10,
  SPECIAL_ACTION_INCREMENT_STEP: 20,
};

export const calculateSpecialPoints = (count: number, initialIncrement: number, incrementStep: number): number => {
  if (count <= 1) return 0;
  
  // Based on the pattern: 1=0, 2=10, 3=40, 4=90
  // Increments are 10, 30, 50... which is an arithmetic progression
  let points = 0;
  let increment = initialIncrement;
  for (let i = 2; i <= count; i++) {
    points += increment;
    increment += incrementStep;
  }
  return points;
};

export const calculateTierLimit = (tier: number): number => {
  return 20 + tier * 10;
};

export const TIER_OPTIONS = Array.from({ length: 15 }, (_, i) => i + 1);