import { readJson, writeJson } from '$lib/server/demoStorage';
import { RESEARCH_DATA } from '$lib/data/gameData';

const BUILDS_FILE = 'builds.json';
const FLEETS_FILE = 'fleets.json';
const PLAYER_FILE = 'player.json';

export interface BuildEntry { id: string; type?: string; createdAt: string; status: string; durationSeconds?: number; result?: unknown; [k: string]: unknown }
export interface FleetEntry { id: string; createdAt: string; etaSeconds: number; status: string; ships?: Record<string, number>; origin?: string; destination?: string; targetIsNpc?: boolean; [k: string]: unknown }
export type Player = { playerId?: string; displayName?: string; ships?: Record<string, number>; resources?: Record<string, number>; [k: string]: unknown } | null;

// Simple deterministic RNG using a seed string
function mulberry32(a: number) {
  return function() {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function seedFrom(...parts: Array<string | number | undefined>) {
  const s = parts.map(p => String(p ?? '')).join('|');
  // simple hash
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

function simulateCombat(attacker: { ships?: Record<string, number>, power?: number }, defender: { power?: number }, seedParts: unknown[]) {
  // compute attacker/defender power if not provided
  const atkPower = attacker.power ?? Object.values(attacker.ships ?? {}).reduce((s, n) => s + (Number(n) * 10), 0);
  const defPower = defender.power ?? (defender.power ?? 1000);
  const seed = seedFrom(...seedParts.map(p => String(p ?? '')));
  const rand = mulberry32(seed);

  // chance to win proportional to power
  const atkRoll = rand() * atkPower;
  const defRoll = rand() * defPower;
  const attackerWins = atkRoll >= defRoll;

  // losses proportional to relative power with randomness
  const atkLossPct = Math.min(0.95, (defPower / Math.max(1, atkPower)) * (0.2 + rand() * 0.5));
  const defLossPct = Math.min(0.95, (atkPower / Math.max(1, defPower)) * (0.2 + rand() * 0.5));

  const attackerLosses = Math.round(atkLossPct * atkPower / 10);
  const defenderLosses = Math.round(defLossPct * defPower / 10);

  return {
    attackerWins,
    attackerLosses,
    defenderLosses,
    seed
  };
}

export async function processBuilds(tickSeconds = 5) {
  const builds = await readJson<BuildEntry[]>(BUILDS_FILE, []);
  const player = await readJson<Player>(PLAYER_FILE, null);
  const now = Date.now();
  const processed: BuildEntry[] = [];
  let changed = false;

  for (const b of builds) {
    if (b.status === 'queued') {
      // If remainingSeconds is explicitly tracked, decrement it using tickSeconds
      if (typeof b.remainingSeconds === 'number') {
        const rem = Math.max(0, (b.remainingSeconds as number) - tickSeconds);
        (b as Record<string, unknown>)['remainingSeconds'] = rem;
        if (rem <= 0) {
          b.status = 'complete';
          b.result = { success: true };
        }
      } else {
        // fallback to createdAt + duration
        const duration = typeof b.durationSeconds === 'number' ? b.durationSeconds : 5;
        const created = new Date(b.createdAt).getTime();
        if ((now - created) / 1000 >= duration) {
          b.status = 'complete';
          b.result = { success: true };
        }
      }

      if (b.status === 'complete') {
        // apply to player: if build has a type and count, increment player's ships
        const t = typeof b.type === 'string' ? b.type : (b as Record<string, unknown>)['shipType'] as string | undefined;
        const count = typeof (b as Record<string, unknown>)['count'] === 'number' ? (b as Record<string, unknown>)['count'] as number : 1;
        if (t && player) {
          player.ships = player.ships ?? {};
          const prev = Number(player.ships[t] ?? 0);
          player.ships[t] = prev + count;
        }
        processed.push(b);
        changed = true;
      }
    }
  }

  if (changed) {
    await writeJson(BUILDS_FILE, builds);
    if (player) await writeJson(PLAYER_FILE, player);
  }

  return { processed };
}

export async function processFleets(tickSeconds = 5) {
  const fleets = await readJson<FleetEntry[]>(FLEETS_FILE, []);
  const processed: FleetEntry[] = [];
  let changed = false;

  for (const f of fleets) {
    if (f.status === 'in_transit') {
      // decrement ETA
      f.etaSeconds = Math.max(0, (typeof f.etaSeconds === 'number' ? f.etaSeconds : 0) - tickSeconds);
      if (f.etaSeconds <= 0) {
        // arrived
        f.status = 'arrived';
        // run combat if targetIsNpc
        if (f.targetIsNpc) {
          const attacker = { ships: f.ships };
          const defender = { power: 800 };
          const combat = simulateCombat(attacker, defender, [f.id, f.createdAt]);
          f.combat = combat;
          f.result = { rewards: combat.attackerWins ? { credits: 100 } : { credits: 10 } };
        } else {
          f.result = { notes: 'arrived' };
        }
        processed.push(f);
        changed = true;
      }
    }
  }

  if (changed) await writeJson(FLEETS_FILE, fleets);

  return { processed };
}

export async function processTick(tickSeconds = 5) {
  const buildsRes = await processBuilds(tickSeconds);
  const fleetsRes = await processFleets(tickSeconds);
  const researchRes = await processResearch(tickSeconds);
  return { builds: buildsRes.processed, fleets: fleetsRes.processed, research: researchRes.processed };
}

export async function processResearch(tickSeconds = 5) {
  const player = await readJson<Player>(PLAYER_FILE, null);
  const processed: Array<{ techId: string; newLevel: number }> = [];
  let changed = false;
  if (!player) return { processed };

  const research: Record<string, { startedAt?: number; level?: number }> = (player as any).research || {};
  const now = Date.now();

  for (const techId of Object.keys(research)) {
    const entry = research[techId];
    if (!entry) continue;
    const startedAt = typeof entry.startedAt === 'number' ? entry.startedAt : null;
    const currentLevel = typeof entry.level === 'number' ? entry.level : 0;
    if (startedAt) {
      const timeFn = (RESEARCH_DATA as any)[techId]?.time as ((lvl: number) => number) | undefined;
      const duration = typeof timeFn === 'function' ? timeFn(currentLevel) : 5;
      if ((now - startedAt) / 1000 >= duration) {
        // finish research: increment level and clear startedAt
        research[techId] = { level: currentLevel + 1 };
        processed.push({ techId, newLevel: currentLevel + 1 });
        changed = true;
      }
    }
  }

  if (changed) {
    (player as any).research = research;
    await writeJson(PLAYER_FILE, player);
  }

  return { processed };
}
