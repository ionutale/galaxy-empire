import type { RequestHandler } from '@sveltejs/kit';
import { sessionCookieName, validateSessionToken } from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { RESEARCH_DATA } from '$lib/data/gameData';

export const POST: RequestHandler = async (event) => {
  const token = event.cookies.get(sessionCookieName);
  if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const { user } = await validateSessionToken(token);
  if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const body = await event.request.json();
  const techId = String(body.techId || '');

  if (!techId) {
    return new Response(JSON.stringify({ error: 'invalid_input' }), { status: 400 });
  }

  const techDef = (RESEARCH_DATA as any)[techId];
  if (!techDef) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

  // Get current level
  const currentResearch = await db
    .select()
    .from(table.playerResearch)
    .where(eq(table.playerResearch.userId, user.id));

  const currentLevel = currentResearch.find(r => r.techId === techId)?.level || 0;
  const nextLevel = currentLevel + 1;

  const cost = techDef.cost ? techDef.cost(nextLevel) : {};
  const time = techDef.time ? techDef.time(nextLevel) : 60;

  // Check resources
  const [pState] = await db
    .select()
    .from(table.playerState)
    .where(eq(table.playerState.userId, user.id));

  if (!pState) return new Response(JSON.stringify({ error: 'player_not_found' }), { status: 404 });

  if (
    pState.metal < (cost.metal || 0) ||
    pState.crystal < (cost.crystal || 0) ||
    pState.fuel < (cost.deuterium || 0) || // Mapping deuterium to fuel
    pState.credits < (cost.credits || 0)
  ) {
    return new Response(JSON.stringify({ error: 'insufficient_resources' }), { status: 400 });
  }

  // Deduct resources
  await db
    .update(table.playerState)
    .set({
      metal: pState.metal - (cost.metal || 0),
      crystal: pState.crystal - (cost.crystal || 0),
      fuel: pState.fuel - (cost.deuterium || 0),
      credits: pState.credits - (cost.credits || 0)
    })
    .where(eq(table.playerState.userId, user.id));

  // Add to build queue
  const now = new Date();
  const duration = time;
  const entryId = `research-${now.getTime()}`;

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

  return new Response(JSON.stringify({ queued: true, id: entryId }), {
    headers: { 'content-type': 'application/json' }
  });
};
