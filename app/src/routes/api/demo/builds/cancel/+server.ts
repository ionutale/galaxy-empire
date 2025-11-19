import type { RequestHandler } from './$types';
import { readJson, writeJson } from '$lib/server/demoStorage';
import { BUILDING_DATA } from '$lib/data/gameData';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { playerState } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { validateSessionToken } from '$lib/server/auth';
import { sessionCookieName } from '$lib/server/auth';
import type { BuildEntry, PlayerState as PlayerStateType, PlayerBuilding } from '$lib/types';

const BUILDS_FILE = 'builds.json';
const PLAYER_FILE = 'player.json';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const token = cookies.get(sessionCookieName);
    if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

    const { user } = await validateSessionToken(token);
    if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

    const { buildId } = await request.json() as { buildId?: string };
    if (!buildId) return new Response(JSON.stringify({ error: 'missing buildId' }), { status: 400 });

    const builds = await readJson(BUILDS_FILE, [] as BuildEntry[]);
    const buildIndex = builds.findIndex((b) => b.id === buildId && b.userId === user.id);

    if (buildIndex === -1) {
      return new Response(JSON.stringify({ error: 'build not found' }), { status: 404 });
    }

    const build = builds[buildIndex];
    if (build.status !== 'queued' && build.status !== 'in-progress') {
      return new Response(JSON.stringify({ error: 'cannot cancel completed build' }), { status: 400 });
    }

    // Remove build from queue
    builds.splice(buildIndex, 1);
    await writeJson(BUILDS_FILE, builds);

    // Refund resources
    if (build.buildingId) {
      const buildingDef = BUILDING_DATA[build.buildingId];
      if (buildingDef) {
        const existingBuildings = (await db.select().from(table.playerBuildings).where(eq(table.playerBuildings.userId, user.id))) as PlayerBuilding[];
        const currentLevel = (existingBuildings.find((b) => b.buildingId === build.buildingId)?.level) ?? 0;
        // The build was for the next level
        const cost = buildingDef.cost?.(currentLevel + 1);

        if (cost) {
          const [pState] = (await db.select().from(playerState).where(eq(playerState.userId, user.id))) as PlayerStateType[];
          if (pState) {
            await db.update(playerState).set({
              credits: pState.credits + (cost.credits ?? 0),
              metal: pState.metal + (cost.metal ?? 0),
              crystal: pState.crystal + (cost.crystal ?? 0),
              fuel: pState.fuel + (cost.fuel ?? 0)
            }).where(eq(playerState.userId, user.id));
            
             // update demo player.json (if present) so UI reflects refunded resources in demo mode
            try {
                const demoPlayer = await readJson(PLAYER_FILE, null as any);
                if (demoPlayer) {
                demoPlayer.resources = demoPlayer.resources ?? {};
                demoPlayer.resources.credits = (Number(demoPlayer.resources.credits ?? pState.credits) + (cost.credits ?? 0));
                demoPlayer.resources.metal = (Number(demoPlayer.resources.metal ?? pState.metal) + (cost.metal ?? 0));
                demoPlayer.resources.crystal = (Number(demoPlayer.resources.crystal ?? pState.crystal) + (cost.crystal ?? 0));
                demoPlayer.resources.fuel = (Number(demoPlayer.resources.fuel ?? pState.fuel) + (cost.fuel ?? 0));
                await writeJson(PLAYER_FILE, demoPlayer);
                }
            } catch (_) {
                // ignore demo write errors
            }
          }
        }
      }
    }

    // Return updated state
    let state: Record<string, any> = {};
    try {
      const stateRow = (await db.select().from(table.playerState).where(eq(table.playerState.userId, user.id)))[0] as PlayerStateType | undefined;
      const ships = await db.select().from(table.playerShips).where(eq(table.playerShips.userId, user.id));
      const buildsList = await readJson(BUILDS_FILE, [] as BuildEntry[]);
      const buildingsResult = (await db.select().from(table.playerBuildings).where(eq(table.playerBuildings.userId, user.id))) as PlayerBuilding[];

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
       state = await readJson(PLAYER_FILE, {} as any);
    }

    return new Response(JSON.stringify({ state }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Error cancelling build:', err);
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500 });
  }
};
