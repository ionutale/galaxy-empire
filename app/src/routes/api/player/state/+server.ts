import type { RequestHandler } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth';
import { sessionCookieName } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
  const token = event.cookies.get(sessionCookieName);
  if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const { user } = await validateSessionToken(token);
  if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  // starter player state
  const [stateRow] = await db.select().from(table.playerState).where(eq(table.playerState.userId, user.id));
  const ships = await db.select().from(table.playerShips).where(eq(table.playerShips.userId, user.id)).all();

  const state = {
    playerId: user.id,
    username: user.username,
    level: stateRow?.level ?? 1,
    power: stateRow?.power ?? 10,
    resources: { credits: stateRow?.credits ?? 1000, metal: stateRow?.metal ?? 500, crystal: stateRow?.crystal ?? 200, fuel: stateRow?.fuel ?? 100 },
    ships
  };

  return new Response(JSON.stringify({ state }), { status: 200, headers: { 'content-type': 'application/json' } });
};
