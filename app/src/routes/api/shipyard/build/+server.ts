import type { RequestHandler } from '@sveltejs/kit';
import { sessionCookieName, validateSessionToken } from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

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

  const [template] = await db.select().from(table.shipTemplate).where(eq(table.shipTemplate.id, shipTemplateId));
  if (!template) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });

  const now = Date.now();
  const eta = now + template.buildTime * 1000 * quantity; // buildTime in seconds
  const id = crypto.randomUUID();

  await db.insert(table.buildQueue).values({ id, userId: user.id, shipTemplateId, quantity, startedAt: new Date(now), eta: new Date(eta) }).run();

  return new Response(JSON.stringify({ queued: true, id }), { headers: { 'content-type': 'application/json' } });
};
