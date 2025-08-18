export const roleWeights: Record<string, number> = {
  scout: 1,
  fighter: 3,
  cruiser: 6
};

export const baseWinChance = 0.3; // base
export const winChancePerWeight = 0.1; // per weight
export const maxWinChance = 0.95;

export const lossPctOnSuccess = 0.1;
export const lossPctOnFailure = 0.5;

export const rewardMultiplier = 10; // credits per survivor per weight
