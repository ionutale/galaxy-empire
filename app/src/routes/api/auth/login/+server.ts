import type { RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { verify } from '@node-rs/argon2';
import {
  generateSessionToken,
  createSession,
  setSessionTokenCookie
} from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
  const { request } = event;
  const body = await request.json();
  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'invalid_input' }), { status: 400 });
  }

  const [row] = await db.select().from(table.user).where(eq(table.user.username, username));
  if (!row) {
    return new Response(JSON.stringify({ error: 'invalid_credentials' }), { status: 401 });
  }

  const ok = await verify(row.passwordHash, password);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'invalid_credentials' }), { status: 401 });
  }

  const token = generateSessionToken();
  const session = await createSession(token, row.id);
  setSessionTokenCookie(event, token, session.expiresAt);

  return new Response(JSON.stringify({ user: { id: row.id, username: row.username } }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};
