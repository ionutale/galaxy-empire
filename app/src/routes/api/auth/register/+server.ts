import type { RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { hash } from '@node-rs/argon2';
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

  if (!username || password.length < 6) {
    return new Response(JSON.stringify({ error: 'invalid_input' }), { status: 400 });
  }

  // check unique
  const existing = await db.select({ id: table.user.id }).from(table.user).where(eq(table.user.username, username));
  if (existing.length > 0) {
    return new Response(JSON.stringify({ error: 'username_taken' }), { status: 409 });
  }

  const id = crypto.randomUUID();
  const passwordHash = await hash(password);

  await db.insert(table.user).values({ id, username, passwordHash }).run();

  const token = generateSessionToken();
  const session = await createSession(token, id);

  setSessionTokenCookie(event, token, session.expiresAt);

  return new Response(JSON.stringify({ user: { id, username } }), {
    status: 201,
    headers: { 'content-type': 'application/json' }
  });
};
