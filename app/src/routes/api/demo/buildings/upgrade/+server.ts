import type { RequestHandler } from './$types';
import { readJson, writeJson } from '$lib/server/demoStorage';
import { BUILDING_DATA } from '$lib/data/gameData';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { playerState } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { validateSessionToken } from '$lib/server/auth';
import { sessionCookieName } from '$lib/server/auth';

const PLAYER_FILE = 'player.json';
const BUILDS_FILE = 'builds.json';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const token = cookies.get(sessionCookieName);
    if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

    const { user } = await validateSessionToken(token);
    if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

    const { buildingId } = await request.json();
    if (!buildingId) return new Response(JSON.stringify({ error: 'missing buildingId' }), { status: 400 });

    const [pState] = await db.select().from(playerState).where(eq(playerState.userId, user.id));
    if (!pState) return new Response(JSON.stringify({ error: 'player not found' }), { status: 404 });

    const buildingDef = BUILDING_DATA[buildingId];
    if (!buildingDef) return new Response(JSON.stringify({ error: 'building not found' }), { status: 404 });

    const currentLevel = 0; // Assuming level is managed elsewhere or starts at 0
    const cost = buildingDef.cost?.(currentLevel + 1);

    if (cost) {
      if (pState.metal < (cost.metal ?? 0) || pState.crystal < (cost.crystal ?? 0)) {
        return new Response(JSON.stringify({ error: 'insufficient resources' }), { status: 400 });
      }

      await db.update(playerState).set({
        metal: pState.metal - (cost.metal ?? 0),
        crystal: pState.crystal - (cost.crystal ?? 0)
      }).where(eq(playerState.userId, user.id));
    }

    // enqueue building upgrade as a build
    const builds = await readJson(BUILDS_FILE, [] as any[]);
    const now = new Date().toISOString();
    const duration = 10; // default duration seconds for demo; could use BUILDING_DATA time func
  const entry = { id: `build-${Date.now()}`, type: 'building', buildingId, createdAt: now, durationSeconds: duration, status: 'queued', userId: user.id };
    builds.push(entry);
    await writeJson(BUILDS_FILE, builds);

    // Build the response state from the DB (so UI reflects the updated resources)
    let state: any = {};
    try {
      const stateRow = (await db.select().from(table.playerState).where(eq(table.playerState.userId, user.id)))[0];
      const ships = await db.select().from(table.playerShips).where(eq(table.playerShips.userId, user.id)).all();
      const buildsList = await readJson(BUILDS_FILE, [] as any[]);
      const buildingsResult = await db.select().from(table.playerBuildings).where(eq(table.playerBuildings.userId, user.id)).all();

      const buildings = buildingsResult.reduce((acc: any, b: any) => {
        acc[b.buildingId] = b.level;
        return acc;
      }, {} as Record<string, number>);

      state = {
        playerId: user.id,
        username: user.username,
        level: stateRow?.level ?? 1,
        power: stateRow?.power ?? 10,
        resources: {
          credits: stateRow?.credits ?? 1000,
          metal: stateRow?.metal ?? 500,
          crystal: stateRow?.crystal ?? 200,
          fuel: stateRow?.fuel ?? 100
        },
        ships,
        builds: buildsList,
        buildings
      };
    } catch (err) {
      // fallback: return demo player file state if DB read fails
      state = await readJson(PLAYER_FILE, {} as any);
    }

    return new Response(JSON.stringify({ state, queued: entry }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
  }
};
