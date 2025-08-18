import type { RequestHandler } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth';
import { sessionCookieName } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
  const token = event.cookies.get(sessionCookieName);
  if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const { user } = await validateSessionToken(token);
  if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  // starter player state
  const state = {
    playerId: user.id,
    username: user.username,
    level: 1,
    power: 10,
    resources: { credits: 1000, metal: 500, crystal: 200, fuel: 100 }
  };

  return new Response(JSON.stringify({ state }), { status: 200, headers: { 'content-type': 'application/json' } });
};
