import type { RequestHandler } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth';
import { sessionCookieName } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { readJson } from '$lib/server/demoStorage';

interface Build {
  id: string;
  type: 'building' | 'ship';
  buildingId?: string;
  shipId?: string;
  createdAt: string;
  durationSeconds: number;
  status: 'queued' | 'in-progress' | 'completed';
}

const BUILDS_FILE = 'builds.json';
const PLAYER_FILE = 'player.json';

export const GET: RequestHandler = async (event) => {
  const token = event.cookies.get(sessionCookieName);
  if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const { user } = await validateSessionToken(token);
  if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  // starter player state
  let stateRow: any = null;
  let ships: any[] = [];
  let builds: Build[] = [];
  let buildingsResult: any[] = [];
  let research: Record<string, { level: number }> = {};

  try {
    stateRow = (await db.select().from(table.playerState).where(eq(table.playerState.userId, user.id)))[0];
    ships = await db.select().from(table.playerShips).where(eq(table.playerShips.userId, user.id));
    builds = await readJson(BUILDS_FILE, [] as BuildEntry[]);
    buildingsResult = await db.select().from(table.playerBuildings).where(eq(table.playerBuildings.userId, user.id));
    const researchResult = await db.select().from(table.playerResearch).where(eq(table.playerResearch.userId, user.id));
    
    // Convert DB research rows to map
    research = researchResult.reduce((acc, r) => {
      acc[r.techId] = { level: r.level };
      return acc;
    }, {} as Record<string, { level: number }>);

    // Fallback/Merge with demo player.json if needed (optional, but good for hybrid state)
    const demoPlayer = await readJson(PLAYER_FILE, {} as any);
    if (demoPlayer?.research) {
      for (const [k, v] of Object.entries(demoPlayer.research as Record<string, { level: number }>)) {
        if (!research[k] || (v.level > research[k].level)) {
          research[k] = v;
        }
      }
    }
  } catch (err) {
    // If the DB or tables don't exist (common in fresh dev clones), fall back to demo/defaults
    console.warn('player state DB query failed, falling back to defaults', err?.toString?.() ?? err);
    builds = await readJson<Build[]>(BUILDS_FILE, []);
    const demoPlayer = await readJson(PLAYER_FILE, {} as any);
    research = demoPlayer?.research || {};
    stateRow = undefined;
    ships = [];
    buildingsResult = [];
  }

  const buildings = buildingsResult.reduce((acc, b) => {
    acc[b.buildingId] = b.level;
    return acc;
  }, {} as Record<string, number>);

  const state = {
    playerId: user.id,
    username: user.username,
    level: stateRow?.level ?? 1,
    power: stateRow?.power ?? 10,
    resources: { credits: stateRow?.credits ?? 1000, metal: stateRow?.metal ?? 500, crystal: stateRow?.crystal ?? 200, fuel: stateRow?.fuel ?? 100 },
    ships,
    builds,
    buildings,
    research
  };

  return new Response(JSON.stringify({ state }), { status: 200, headers: { 'content-type': 'application/json' } });
};
