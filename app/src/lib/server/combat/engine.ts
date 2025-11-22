import { SHIP_TEMPLATES } from '$lib/data/gameData';

export interface CombatShip {
  templateId: string;
  quantity: number;
  hp: number;
  shield: number;
  attack: number;
}

export interface CombatSide {
  id: string;
  ships: CombatShip[];
  losses: Record<string, number>;
}

export interface CombatReportData {
  attackerId: string;
  defenderId: string;
  outcome: 'attacker_win' | 'defender_win' | 'draw';
  rounds: number;
  log: any[];
  loot?: { metal: number; crystal: number; fuel: number };
  attackerLosses: Record<string, number>;
  defenderLosses: Record<string, number>;
}

function createCombatFleet(composition: Record<string, number>): CombatShip[] {
  return Object.entries(composition).map(([id, count]) => {
    const template = SHIP_TEMPLATES.find(s => s.shipId === id);
    if (!template) throw new Error(`Invalid ship template: ${id}`);
    // Basic stats - in a real game these would come from the DB/Template
    // For now, we'll hardcode some stats based on role or ID if not in template
    // Assuming SHIP_TEMPLATES has basic info, but we need combat stats.
    // Let's mock some stats based on cost/role for now.
    const attack = Math.floor(template.costCredits / 10);
    const hp = Math.floor(template.costCredits / 5);
    const shield = Math.floor(template.costCredits / 20);

    return {
      templateId: id,
      quantity: count,
      hp,
      shield,
      attack
    };
  });
}

export function simulateCombat(
  attackerId: string,
  attackerComposition: Record<string, number>,
  defenderId: string,
  defenderComposition: Record<string, number>
): CombatReportData {
  const attacker: CombatSide = {
    id: attackerId,
    ships: createCombatFleet(attackerComposition),
    losses: {}
  };

  const defender: CombatSide = {
    id: defenderId,
    ships: createCombatFleet(defenderComposition),
    losses: {}
  };

  const log: any[] = [];
  let round = 0;
  const MAX_ROUNDS = 6;

  while (round < MAX_ROUNDS && attacker.ships.length > 0 && defender.ships.length > 0) {
    round++;
    const roundLog = { round, attackerFire: 0, defenderFire: 0, attackerLosses: {}, defenderLosses: {} };

    // Calculate total firepower
    const attackerFire = attacker.ships.reduce((sum, s) => sum + s.attack * s.quantity, 0);
    const defenderFire = defender.ships.reduce((sum, s) => sum + s.attack * s.quantity, 0);

    roundLog.attackerFire = attackerFire;
    roundLog.defenderFire = defenderFire;

    // Apply damage to Defender
    applyDamage(attackerFire, defender, roundLog.defenderLosses);

    // Apply damage to Attacker
    applyDamage(defenderFire, attacker, roundLog.attackerLosses);

    log.push(roundLog);
  }

  let outcome: 'attacker_win' | 'defender_win' | 'draw' = 'draw';
  if (attacker.ships.length === 0 && defender.ships.length === 0) outcome = 'draw';
  else if (attacker.ships.length === 0) outcome = 'defender_win';
  else if (defender.ships.length === 0) outcome = 'attacker_win';
  else outcome = 'draw';

  return {
    attackerId,
    defenderId,
    outcome,
    rounds: round,
    log,
    loot: outcome === 'attacker_win' ? { metal: 1000, crystal: 500, fuel: 200 } : undefined,
    attackerLosses: attacker.losses,
    defenderLosses: defender.losses
  };
}

function applyDamage(damage: number, side: CombatSide, roundLosses: Record<string, number>) {
  // Simple mechanic: damage is distributed across all ships
  // Each ship takes a share of damage. If damage > hp + shield, one ship dies.

  let remainingDamage = damage;

  // Randomly target ships? Or spread? Let's spread for simplicity first, 
  // or just kill ships one by one from the weakest?
  // Let's distribute damage proportional to total HP pool?
  // Simpler: Each point of damage kills a unit of HP.

  // Let's iterate through ships and apply damage
  for (let i = side.ships.length - 1; i >= 0; i--) {
    if (remainingDamage <= 0) break;

    const ship = side.ships[i];
    const totalHp = ship.quantity * (ship.hp + ship.shield);

    // Damage taken by this stack
    // Let's say damage is spread evenly? No, focused fire is more realistic/common in simple sims.
    // Let's just apply damage to the first stack (meat shield)

    const damageToStack = remainingDamage; // All damage hits this stack? No, that's too harsh.
    // Let's assume damage is distributed randomly.
    // For this MVP, let's just reduce quantity based on total damage vs total fleet HP.

    // Actually, let's do a simple: Total Damage / Average HP per ship = Ships lost.
    // But we have different ship types.

    // Improved Simple Logic:
    // Damage is applied to a random ship stack.
    const damagePerShot = 100; // Abstract "shot"
    const shots = Math.ceil(damage / damagePerShot);

    for (let s = 0; s < shots; s++) {
      if (side.ships.length === 0) break;
      const targetIndex = Math.floor(Math.random() * side.ships.length);
      const target = side.ships[targetIndex];

      // 1 shot kills 1 ship? Or reduces HP?
      // Let's say 1 shot deals damagePerShot.
      if (damagePerShot >= target.hp + target.shield) {
        target.quantity--;
        side.losses[target.templateId] = (side.losses[target.templateId] || 0) + 1;
        roundLosses[target.templateId] = (roundLosses[target.templateId] || 0) + 1;

        if (target.quantity <= 0) {
          side.ships.splice(targetIndex, 1);
        }
      }
    }
    remainingDamage = 0; // All damage resolved via "shots"
  }
}
