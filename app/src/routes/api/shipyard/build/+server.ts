import type { RequestHandler } from '@sveltejs/kit';
import { sessionCookieName, validateSessionToken } from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

import { SHIP_TEMPLATES } from '$lib/data/gameData';
import type { BuildEntry } from '$lib/types';




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

  } catch (_) { }

  // Add to builds.json queue
  // No need to read builds from file; using DB for persistence.
  const now = new Date();
  const duration = (template.buildTime || 10) * quantity;
  const entryId = `build-${now.getTime()}`;

  const entry: BuildEntry = {
    id: entryId,
    type: 'ship', // processor uses this or shipType
    // @ts-ignore - processor handles shipType/count
    shipType: shipTemplateId,
    count: quantity,
    buildingId: shipTemplateId, // Hack: set buildingId so sidebar displays the name using BUILDING_DATA fallback or we fix sidebar
    createdAt: now.toISOString(),
    durationSeconds: duration,
    remainingSeconds: duration,
    status: 'queued',
    userId: user.id
  };

  // Entry already persisted to DB
  // No need to write builds to file; DB insertion already performed.

  // Sync to DB
  try {
    await db.insert(table.buildQueue).values({
      id: entryId,
      userId: user.id,
      type: 'ship',
      shipTemplateId: shipTemplateId,
      quantity: quantity,
      startedAt: now,
      eta: new Date(now.getTime() + duration * 1000),
      totalDuration: duration
    });
  } catch (e) {
    console.error('Failed to sync build to DB', e);
  }

  return new Response(JSON.stringify({ queued: true, id: entry.id }), { headers: { 'content-type': 'application/json' } });
};
