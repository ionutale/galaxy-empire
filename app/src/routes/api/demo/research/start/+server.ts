import type { RequestHandler } from './$types';
import { readJson, writeJson } from '$lib/server/demoStorage';
import { RESEARCH_DATA, BUILDING_DATA } from '$lib/data/gameData';
import { sessionCookieName, validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { BuildEntry } from '$lib/types';

const BUILDS_FILE = 'builds.json';
const PLAYER_FILE = 'player.json';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const token = cookies.get(sessionCookieName);
    if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

    const { user } = await validateSessionToken(token);
    if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

    const { techId } = await request.json();
    if (!techId) return new Response(JSON.stringify({ error: 'missing techId' }), { status: 400 });

    const techDef = (RESEARCH_DATA as any)[techId];
    if (!techDef) return new Response(JSON.stringify({ error: 'tech not found' }), { status: 404 });

    // Get current state
    const [pState] = await db.select().from(table.playerState).where(eq(table.playerState.userId, user.id));
    if (!pState) return new Response(JSON.stringify({ error: 'player not found' }), { status: 404 });

    // Get current research level (from player.json for now as DB table might not exist)
    const demoPlayer = await readJson(PLAYER_FILE, {} as any);
    const currentLevel = demoPlayer?.research?.[techId]?.level || 0;
    const nextLevel = currentLevel + 1;

    // Check requirements (Research Lab)
    // We need to check buildings. For now, let's assume we need Research Lab level 1 for everything if not specified
    // Or check gameData requirements if they exist.
    // RESEARCH_DATA doesn't have explicit requirements in the file I read earlier, but let's check if it does.
    // It seems RESEARCH_DATA entries have cost, time, effect.
    // But usually research requires a Research Lab.
    const buildings = demoPlayer?.buildings || {};
    const labLevel = buildings['researchLab'] || 0;
    if (labLevel < 1) {
       return new Response(JSON.stringify({ error: 'Research Lab required' }), { status: 400 });
    }

    // Calculate cost
    const cost = techDef.cost ? techDef.cost(nextLevel) : {};
    const costCredits = cost.credits || 0;
    const costMetal = cost.metal || 0;
    const costCrystal = cost.crystal || 0;
    const costFuel = cost.fuel || cost.deuterium || 0; // gameData uses deuterium sometimes

    if (pState.credits < costCredits || pState.metal < costMetal || pState.crystal < costCrystal || pState.fuel < costFuel) {
      return new Response(JSON.stringify({ error: 'insufficient resources' }), { status: 400 });
    }

    // Deduct resources
    await db.update(table.playerState).set({
      credits: pState.credits - costCredits,
      metal: pState.metal - costMetal,
      crystal: pState.crystal - costCrystal,
      fuel: pState.fuel - costFuel
    }).where(eq(table.playerState.userId, user.id));

    // Update demo player.json resources
    if (demoPlayer) {
      demoPlayer.resources = demoPlayer.resources ?? {};
      demoPlayer.resources.credits = (Number(demoPlayer.resources.credits ?? pState.credits) - costCredits);
      demoPlayer.resources.metal = (Number(demoPlayer.resources.metal ?? pState.metal) - costMetal);
      demoPlayer.resources.crystal = (Number(demoPlayer.resources.crystal ?? pState.crystal) - costCrystal);
      demoPlayer.resources.fuel = (Number(demoPlayer.resources.fuel ?? pState.fuel) - costFuel);
      await writeJson(PLAYER_FILE, demoPlayer);
    }

    // Add to queue
    const builds = await readJson(BUILDS_FILE, [] as BuildEntry[]);
    const now = new Date();
    const duration = techDef.time ? techDef.time(nextLevel) : 30;
    const entryId = `research-${now.getTime()}`;
    
    const entry: BuildEntry = {
      id: entryId,
      type: 'research',
      // @ts-ignore
      techId: techId,
      buildingId: techId, // Hack for sidebar name display
      createdAt: now.toISOString(),
      durationSeconds: duration,
      remainingSeconds: duration,
      status: 'queued',
      userId: user.id
    };
    
    builds.push(entry);
    await writeJson(BUILDS_FILE, builds);

    // Sync to DB
    try {
      await db.insert(table.buildQueue).values({
        id: entryId,
        userId: user.id,
        type: 'research',
        techId: techId,
        quantity: 1,
        startedAt: now,
        eta: new Date(now.getTime() + duration * 1000),
        totalDuration: duration
      });
    } catch (e) {
      console.error('Failed to sync research to DB', e);
    }

    return new Response(JSON.stringify({ queued: true, id: entry.id }), { headers: { 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500 });
  }
};
