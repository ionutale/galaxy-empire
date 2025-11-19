import type { RequestHandler } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth';
import { sessionCookieName } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';


interface Build {
  id: string;
  type: 'building' | 'ship';
  buildingId?: string;
  shipId?: string;
  createdAt: string;
  durationSeconds: number;
  status: 'queued' | 'in-progress' | 'completed';
}


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
    const rawBuilds = await db.select().from(table.buildQueue).where(eq(table.buildQueue.userId, user.id));
    const processedBuilds = await db.select().from(table.processedBuilds).where(eq(table.processedBuilds.userId, user.id));

    // Map DB builds to include 'status' for frontend compatibility
    const activeBuilds = rawBuilds.map(b => ({
      ...b,
      status: 'in-progress', // All builds in queue are active
      createdAt: b.startedAt.toISOString(), // Ensure date string format if needed
      durationSeconds: b.totalDuration,
      remainingSeconds: Math.max(0, Math.floor((b.eta.getTime() - Date.now()) / 1000))
    }));

    const completedBuilds = processedBuilds.map(b => ({
      id: b.id,
      type: b.type as 'building' | 'ship', // Cast type
      buildingId: b.buildingId,
      shipTemplateId: b.shipTemplateId,
      techId: b.techId,
      quantity: b.quantity,
      status: 'completed',
      createdAt: b.processedAt.toISOString(), // Use processed time as creation time for list sorting
      durationSeconds: 0,
      remainingSeconds: 0
    }));

    builds = [...activeBuilds, ...completedBuilds] as any[];

    console.log('[api/player/state] fetched builds for user', user.id, { active: activeBuilds.length, completed: completedBuilds.length });
    buildingsResult = await db.select().from(table.playerBuildings).where(eq(table.playerBuildings.userId, user.id));
    const researchResult = await db.select().from(table.playerResearch).where(eq(table.playerResearch.userId, user.id));

    // Convert DB research rows to map
    research = researchResult.reduce((acc, r) => {
      acc[r.techId] = { level: r.level };
      return acc;
    }, {} as Record<string, { level: number }>);

    // Fallback/Merge with demo player.json removed as we are fully DB-based now
    // const demoPlayer = await readJson(PLAYER_FILE, {} as any);
    // if (demoPlayer?.research) {
    //   for (const [k, v] of Object.entries(demoPlayer.research as Record<string, { level: number }>)) {
    //     if (!research[k] || (v.level > research[k].level)) {
    //       research[k] = v;
    //     }
    //   }
    // }
  } catch (err) {
    // If DB query fails, fallback to empty defaults
    console.warn('player state DB query failed, falling back to defaults', err?.toString?.() ?? err);
    builds = [];
    research = {};
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
