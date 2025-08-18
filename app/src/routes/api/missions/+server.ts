import type { RequestHandler } from '@sveltejs/kit';
import { sessionCookieName, validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
  const token = event.cookies.get(sessionCookieName);
  if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const { user } = await validateSessionToken(token);
  if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const missions = await db.select().from(table.missions).where(eq(table.missions.userId, user.id)).all();
  return new Response(JSON.stringify({ missions }), { headers: { 'content-type': 'application/json' } });
};
