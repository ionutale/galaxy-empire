import type { RequestHandler } from './$types';
import { readJson, writeJson } from '$lib/server/demoStorage';
import { BUILDING_DATA } from '$lib/data/gameData';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { playerState } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { validateSessionToken } from '$lib/server/auth';
import { sessionCookieName } from '$lib/server/auth';
import type { BuildEntry, PlayerState as PlayerStateType, PlayerBuilding, User } from '$lib/types';

const PLAYER_FILE = 'player.json';
const BUILDS_FILE = 'builds.json';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const token = cookies.get(sessionCookieName);
    if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

    const { user } = await validateSessionToken(token);
    if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const { buildingId } = await request.json() as { buildingId?: string };
    if (!buildingId) return new Response(JSON.stringify({ error: 'missing buildingId' }), { status: 400 });

  const [pState] = (await db.select().from(playerState).where(eq(playerState.userId, user.id))) as PlayerStateType[];
    if (!pState) return new Response(JSON.stringify({ error: 'player not found' }), { status: 404 });

    const buildingDef = BUILDING_DATA[buildingId];
    if (!buildingDef) return new Response(JSON.stringify({ error: 'building not found' }), { status: 404 });

  // determine current level from DB buildings (fallback to 0)
  const existingBuildings = (await db.select().from(table.playerBuildings).where(eq(table.playerBuildings.userId, user.id)).all()) as PlayerBuilding[];
  const currentLevel = (existingBuildings.find((b) => b.buildingId === buildingId)?.level) ?? 0;
  const cost = buildingDef.cost?.(currentLevel + 1);

  if (cost) {
      // ensure all resource fields are available and sufficient
      const needCredits = cost.credits ?? 0;
      const needMetal = cost.metal ?? 0;
      const needCrystal = cost.crystal ?? 0;
      const needFuel = cost.fuel ?? 0;
      if (pState.credits < needCredits || pState.metal < needMetal || pState.crystal < needCrystal || pState.fuel < needFuel) {
        return new Response(JSON.stringify({ error: 'insufficient resources' }), { status: 400 });
      }

      await db.update(playerState).set({
        credits: pState.credits - needCredits,
        metal: pState.metal - needMetal,
        crystal: pState.crystal - needCrystal,
        fuel: pState.fuel - needFuel
      }).where(eq(playerState.userId, user.id));

      // update demo player.json (if present) so UI reflects deducted resources in demo mode
      try {
        const demoPlayer = await readJson(PLAYER_FILE, null as any);
        if (demoPlayer) {
          demoPlayer.resources = demoPlayer.resources ?? {};
          demoPlayer.resources.credits = (Number(demoPlayer.resources.credits ?? pState.credits) - needCredits);
          demoPlayer.resources.metal = (Number(demoPlayer.resources.metal ?? pState.metal) - needMetal);
          demoPlayer.resources.crystal = (Number(demoPlayer.resources.crystal ?? pState.crystal) - needCrystal);
          demoPlayer.resources.fuel = (Number(demoPlayer.resources.fuel ?? pState.fuel) - needFuel);
          await writeJson(PLAYER_FILE, demoPlayer);
        }
      } catch (_) {
        // ignore demo write errors
      }
    }

  // enqueue building upgrade as a build
  const builds = await readJson(BUILDS_FILE, [] as BuildEntry[]);
  const now = new Date().toISOString();
  const duration = typeof buildingDef.time === 'function' ? buildingDef.time(currentLevel + 1) : 10;
  const entry: BuildEntry = { id: `build-${Date.now()}`, type: 'building', buildingId, createdAt: now, durationSeconds: duration, remainingSeconds: duration, status: 'queued', userId: user.id };
    builds.push(entry);
    await writeJson(BUILDS_FILE, builds);

    

    // Build the response state from the DB (so UI reflects the updated resources)
    let state: Record<string, any> = {};
    try {
      const stateRow = (await db.select().from(table.playerState).where(eq(table.playerState.userId, user.id)))[0] as PlayerStateType | undefined;
      const ships = await db.select().from(table.playerShips).where(eq(table.playerShips.userId, user.id)).all();
      const buildsList = await readJson(BUILDS_FILE, [] as BuildEntry[]);
      const buildingsResult = (await db.select().from(table.playerBuildings).where(eq(table.playerBuildings.userId, user.id)).all()) as PlayerBuilding[];

      const buildings = buildingsResult.reduce((acc: Record<string, number>, b) => {
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
