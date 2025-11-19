import type { RequestHandler } from '@sveltejs/kit';
import { sessionCookieName, validateSessionToken } from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { readJson, writeJson } from '$lib/server/demoStorage';
import { SHIP_TEMPLATES } from '$lib/data/gameData';
import type { BuildEntry } from '$lib/types';

const BUILDS_FILE = 'builds.json';
const PLAYER_FILE = 'player.json';

export const POST: RequestHandler = async (event) => {
  const token = event.cookies.get(sessionCookieName);
  if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const { user } = await validateSessionToken(token);
  if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const body = await event.request.json();
  const shipTemplateId = String(body.shipTemplateId || '');
  const quantity = Number(body.quantity || 1);

  if (!shipTemplateId || quantity < 1) {
    return new Response(JSON.stringify({ error: 'invalid_input' }), { status: 400 });
  }

  const template = SHIP_TEMPLATES.find(s => s.shipId === shipTemplateId);
  if (!template) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

  const cost = template.buildCost || {};
  const costCredits = (cost.credits || 0) * quantity;
  const costMetal = (cost.metal || 0) * quantity;
  const costCrystal = (cost.crystal || 0) * quantity;
  const costFuel = (cost.fuel || 0) * quantity;

  const [pState] = await db.select().from(table.playerState).where(eq(table.playerState.userId, user.id));
  if (!pState) return new Response(JSON.stringify({ error: 'player_not_found' }), { status: 404 });

  if (pState.credits < costCredits || pState.metal < costMetal || pState.crystal < costCrystal || pState.fuel < costFuel) {
    return new Response(JSON.stringify({ error: 'insufficient_resources' }), { status: 400 });
  }

  // Deduct resources
  await db.update(table.playerState).set({
    credits: pState.credits - costCredits,
    metal: pState.metal - costMetal,
    crystal: pState.crystal - costCrystal,
    fuel: pState.fuel - costFuel
  }).where(eq(table.playerState.userId, user.id));

  // Update demo player.json
  try {
    const demoPlayer = await readJson(PLAYER_FILE, null as any);
    if (demoPlayer) {
      demoPlayer.resources = demoPlayer.resources ?? {};
      demoPlayer.resources.credits = (Number(demoPlayer.resources.credits ?? pState.credits) - costCredits);
      demoPlayer.resources.metal = (Number(demoPlayer.resources.metal ?? pState.metal) - costMetal);
      demoPlayer.resources.crystal = (Number(demoPlayer.resources.crystal ?? pState.crystal) - costCrystal);
      demoPlayer.resources.fuel = (Number(demoPlayer.resources.fuel ?? pState.fuel) - costFuel);
      await writeJson(PLAYER_FILE, demoPlayer);
    }
  } catch (_) {}

  // Add to builds.json queue
  const builds = await readJson(BUILDS_FILE, [] as BuildEntry[]);
  const now = new Date().toISOString();
  const duration = (template.buildTime || 10) * quantity;
  
  const entry: BuildEntry = {
    id: `build-${Date.now()}`,
    type: 'ship', // processor uses this or shipType
    // @ts-ignore - processor handles shipType/count
    shipType: shipTemplateId,
    count: quantity,
    buildingId: shipTemplateId, // Hack: set buildingId so sidebar displays the name using BUILDING_DATA fallback or we fix sidebar
    createdAt: now,
    durationSeconds: duration,
    remainingSeconds: duration,
    status: 'queued',
    userId: user.id
  };
  
  builds.push(entry);
  await writeJson(BUILDS_FILE, builds);

  return new Response(JSON.stringify({ queued: true, id: entry.id }), { headers: { 'content-type': 'application/json' } });
};
