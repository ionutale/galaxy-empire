import * as cfg from './missionConfig';
import * as features from './features';

export type MissionResult = {
  outcome: 'success' | 'failure';
  quantityLost: number;
  survivors: number;
  rewardCredits: number;
  rewardMetal: number;
  rewardCrystal: number;
};

export function resolveMission(shipRole: string | undefined, quantity: number): MissionResult {
  const roleWeight = shipRole ? cfg.roleWeights[shipRole] ?? 2 : 2;

  if (!features.isFeatureEnabled('NEW_COMBAT')) {
    // old simple deterministic model
    const winChance = Math.min(cfg.maxWinChance, cfg.baseWinChance + roleWeight * cfg.winChancePerWeight);
    const rnd = Math.random();
    const outcome = rnd < winChance ? 'success' : 'failure';
    const lossPct = outcome === 'success' ? cfg.lossPctOnSuccess : cfg.lossPctOnFailure;
    const quantityLost = Math.floor(quantity * lossPct);
    const survivors = Math.max(0, quantity - quantityLost);
    const baseReward = roleWeight * cfg.rewardMultiplier;
    const rewardCredits = baseReward * survivors;
    const rewardMetal = Math.floor(baseReward * 0.5 * survivors);
    const rewardCrystal = Math.floor(baseReward * 0.25 * survivors);
    return { outcome, quantityLost, survivors, rewardCredits, rewardMetal, rewardCrystal };
  }

  // NEW_COMBAT: slightly different distribution: add variance and scale rewards
  const winChance = Math.min(cfg.maxWinChance, cfg.baseWinChance + roleWeight * cfg.winChancePerWeight + (Math.random() - 0.5) * 0.05);
  const outcome = Math.random() < winChance ? 'success' : 'failure';
  const lossPct = outcome === 'success' ? cfg.lossPctOnSuccess * (1 - roleWeight * 0.02) : Math.min(0.9, cfg.lossPctOnFailure * (1 + roleWeight * 0.02));
  const quantityLost = Math.floor(quantity * lossPct);
  const survivors = Math.max(0, quantity - quantityLost);
  const baseReward = Math.round(roleWeight * cfg.rewardMultiplier * (1 + Math.random() * 0.2));
  const rewardCredits = baseReward * survivors;
  const rewardMetal = Math.floor(baseReward * 0.5 * survivors);
  const rewardCrystal = Math.floor(baseReward * 0.25 * survivors);

  return { outcome, quantityLost, survivors, rewardCredits, rewardMetal, rewardCrystal };
}
