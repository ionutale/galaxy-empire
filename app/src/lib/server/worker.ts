import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { recordRun, recordFailure } from './metrics';

let running = false;

export function startBuildProcessor(intervalMs = 5000) {
  if (running) return;
  running = true;
  console.log('Starting build processor, interval', intervalMs);

  setInterval(async () => {
    try {
      const now = new Date();
      const items = await db.select().from(table.buildQueue).all();
      const due = items.filter((i) => new Date(i.eta).getTime() <= now.getTime());
      let processed = 0;
      for (const item of due) {
        // process in transaction: move to player_ships and delete queue
        await db.transaction(async (ctx) => {
          const existing = (await ctx.select().from(table.playerShips).where(eq(table.playerShips.userId, item.userId)).all()).find((s) => s.shipTemplateId === item.shipTemplateId);
          if (existing) {
            await ctx.update(table.playerShips).set({ quantity: existing.quantity + item.quantity }).where(eq(table.playerShips.id, existing.id)).run();
          } else {
            await ctx.insert(table.playerShips).values({ id: crypto.randomUUID(), userId: item.userId, shipTemplateId: item.shipTemplateId, quantity: item.quantity }).run();
          }
          await ctx.delete(table.buildQueue).where(eq(table.buildQueue.id, item.id)).run();
        });
        processed += 1;
      }
      recordRun(processed);
    } catch (err) {
      console.error('Build processor error', err);
      recordFailure(err);
    }
  }, intervalMs);
}
