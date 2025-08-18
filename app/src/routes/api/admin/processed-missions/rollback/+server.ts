import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

function isAdmin(event: Request) {
  const key = event.headers.get('x-admin-key') || '';
  return env.ADMIN_KEY && key === env.ADMIN_KEY;
}

export const POST: RequestHandler = async ({ request }) => {
  if (!isAdmin(request)) return new Response(null, { status: 403 });
  const body = await request.json();
  const id = String(body.id || '');
  if (!id) return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });

  const [record] = await db.select().from(table.processedMissions).where(eq(table.processedMissions.id, id));
  if (!record) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  if (record.rolledBack) return new Response(JSON.stringify({ error: 'already_rolled_back' }), { status: 400 });

  // reverse rewards and restore lost ships
  await db.transaction(async (ctx) => {
    // revert rewards from player_state
    const state = (await ctx.select().from(table.playerState).where(eq(table.playerState.userId, record.userId)).all())[0];
    if (state) {
      await ctx.update(table.playerState).set({ credits: Math.max(0, state.credits - record.rewardCredits), metal: Math.max(0, state.metal - record.rewardMetal), crystal: Math.max(0, state.crystal - record.rewardCrystal) }).where(eq(table.playerState.userId, record.userId)).run();
    }

    // restore lost ships back to player_ships
    if (record.quantityLost > 0) {
      const ships = await ctx.select().from(table.playerShips).where(eq(table.playerShips.userId, record.userId)).all();
      const existing = ships.find((s) => s.shipTemplateId === record.shipTemplateId);
      if (existing) {
        await ctx.update(table.playerShips).set({ quantity: existing.quantity + record.quantityLost }).where(eq(table.playerShips.id, existing.id)).run();
      } else {
        await ctx.insert(table.playerShips).values({ id: crypto.randomUUID(), userId: record.userId, shipTemplateId: record.shipTemplateId, quantity: record.quantityLost }).run();
      }
    }

    await ctx.update(table.processedMissions).set({ rolledBack: 1, rolledBackAt: new Date() }).where(eq(table.processedMissions.id, id)).run();
  });

  return new Response(JSON.stringify({ rolledBack: true }));
};
