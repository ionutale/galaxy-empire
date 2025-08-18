import type { RequestHandler } from '@sveltejs/kit';
import { sessionCookieName, validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
  const token = event.cookies.get(sessionCookieName);
  if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const { user } = await validateSessionToken(token);
  if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const body = await event.request.json();
  const shipTemplateId = String(body.shipTemplateId || '');
  const quantity = Number(body.quantity || 1);

  if (!shipTemplateId || quantity < 1) return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });

  const ships = await db.select().from(table.playerShips).where(eq(table.playerShips.userId, user.id)).all();
  const existing = ships.find((s) => s.shipTemplateId === shipTemplateId);
  if (!existing || existing.quantity < quantity) return new Response(JSON.stringify({ error: 'insufficient_ships' }), { status: 400 });

  // deduct ships and create mission
  await db.transaction(async (ctx) => {
    const newQty = existing.quantity - quantity;
    if (newQty > 0) {
      await ctx.update(table.playerShips).set({ quantity: newQty }).where(eq(table.playerShips.id, existing.id)).run();
    } else {
      await ctx.delete(table.playerShips).where(eq(table.playerShips.id, existing.id)).run();
    }
    const now = Date.now();
    const eta = now + 60 * 1000; // 60s mission for demo
    await ctx.insert(table.missions).values({ id: crypto.randomUUID(), userId: user.id, shipTemplateId, quantity, startedAt: new Date(now), eta: new Date(eta), status: 'in_progress' }).run();
  });

  return new Response(JSON.stringify({ started: true }), { headers: { 'content-type': 'application/json' } });
};
