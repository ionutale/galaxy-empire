import type { RequestHandler } from '@sveltejs/kit';
import { sessionCookieName, validateSessionToken } from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { retryAsync } from '$lib/server/retry';

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
  const totalCost = template.costCredits * quantity;

  // Initial check (optimization)
  const [initialState] = await db.select().from(table.playerState).where(eq(table.playerState.userId, user.id));
  if (!initialState || (initialState.credits ?? 0) < totalCost) {
    return new Response(JSON.stringify({ error: 'insufficient_funds' }), { status: 402 });
  }

  // perform update + insert in a transaction so a failure rolls back the deduction
  let queuedId: string | undefined;
  try {
    // generate a fresh id per attempt to avoid unique constraint if a retry occurs
    queuedId = await retryAsync(async () => {
      const attemptId = crypto.randomUUID();
      await db.transaction(async (ctx) => {
        // Re-fetch state inside transaction to ensure consistency and lock (if supported)
        const [currentState] = await ctx.select().from(table.playerState).where(eq(table.playerState.userId, user.id));

        if (!currentState || (currentState.credits ?? 0) < totalCost) {
          throw new Error('insufficient_funds');
        }

        const newCredits = (currentState.credits ?? 0) - totalCost;
        await ctx.update(table.playerState).set({ credits: newCredits }).where(eq(table.playerState.userId, user.id));
        await ctx.insert(table.buildQueue).values({ id: attemptId, userId: user.id, shipTemplateId, quantity, startedAt: new Date(now), eta: new Date(eta) });
      });
      return attemptId;
    }, 3, 200, 2);
  } catch (err: any) {
    if (err.message === 'insufficient_funds') {
      return new Response(JSON.stringify({ error: 'insufficient_funds' }), { status: 402 });
    }
    console.error('Failed to queue build transactionally', err);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500 });
  }

  return new Response(JSON.stringify({ queued: true, id: queuedId }), { headers: { 'content-type': 'application/json' } });
};
