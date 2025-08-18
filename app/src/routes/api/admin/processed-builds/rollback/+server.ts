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

  const [record] = await db.select().from(table.processedBuilds).where(eq(table.processedBuilds.id, id));
  if (!record) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  if (record.rolledBack) return new Response(JSON.stringify({ error: 'already_rolled_back' }), { status: 400 });

  // remove ships (simple approach: subtract quantity or delete row when reaching 0)
  const ships = await db.select().from(table.playerShips).where(eq(table.playerShips.userId, record.userId)).all();
  const existing = ships.find((s) => s.shipTemplateId === record.shipTemplateId);
  if (!existing || existing.quantity < record.quantity) {
    return new Response(JSON.stringify({ error: 'insufficient_ships' }), { status: 400 });
  }

  await db.transaction(async (ctx) => {
    const newQty = existing.quantity - record.quantity;
    if (newQty > 0) {
      await ctx.update(table.playerShips).set({ quantity: newQty }).where(eq(table.playerShips.id, existing.id)).run();
    } else {
      await ctx.delete(table.playerShips).where(eq(table.playerShips.id, existing.id)).run();
    }
    await ctx.update(table.processedBuilds).set({ rolledBack: 1, rolledBackAt: new Date() }).where(eq(table.processedBuilds.id, id)).run();
  });

  return new Response(JSON.stringify({ rolledBack: true }));
};
