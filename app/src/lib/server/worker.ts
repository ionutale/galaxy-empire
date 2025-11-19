import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { recordRun, recordFailure } from './metrics';
import { resolveMission } from './missionResolver';
import * as features from './features';
import { processTick } from './processor';
import { logger } from '$lib/logger';

let running = false;

export function startBuildProcessor(intervalMs = 5000) {
  if (running) return;
  running = true;
  logger.info({ intervalMs }, 'Starting build processor');

  setInterval(async () => {
    try {
      const now = new Date();
      const items = await db.select().from(table.buildQueue);
      const due = items.filter((i) => new Date(i.eta).getTime() <= now.getTime());
      let processed = 0;
      for (const item of due) {
        try {
          const { retryAsync } = await import('$lib/server/retry');
          await retryAsync(async () => {
            await db.transaction(async (ctx) => {
              const existingRows = await ctx.select().from(table.playerShips).where(eq(table.playerShips.userId, item.userId));
              const existing = existingRows.find((s) => s.shipTemplateId === item.shipTemplateId);
              if (existing) {
                await ctx.update(table.playerShips).set({ quantity: existing.quantity + item.quantity }).where(eq(table.playerShips.id, existing.id));
              } else {
                await ctx.insert(table.playerShips).values({ id: crypto.randomUUID(), userId: item.userId, shipTemplateId: item.shipTemplateId, quantity: item.quantity });
              }
              await ctx.insert(table.processedBuilds).values({ id: crypto.randomUUID(), userId: item.userId, shipTemplateId: item.shipTemplateId, quantity: item.quantity, processedAt: new Date() });
              await ctx.delete(table.buildQueue).where(eq(table.buildQueue.id, item.id));
            });
          }, 3, 200, 2);
          processed += 1;
        } catch (err) {
          logger.error({ err }, 'Failed processing build item after retries');
          recordFailure(err);
        }
      }
      recordRun(processed);
      // also process demo builds.json entries and sync them to DB if present
      try {
        await processTick();
      } catch (err) {
        logger.error({ err }, 'error running demo processor tick from worker');
      }
      // process missions completion: resolve in_progress missions when ETA passed
      try {
        const missions = await db.select().from(table.missions);
        const dueMissions = missions.filter((m) => new Date(m.eta).getTime() <= Date.now() && m.status === 'in_progress');
        for (const ms of dueMissions) {
          try {
            await db.transaction(async (ctx) => {
              // determine ship role from template and resolve mission
              const tmpl = (await ctx.select().from(table.shipTemplate).where(eq(table.shipTemplate.id, ms.shipTemplateId)))[0];
              const shipRole = tmpl?.role;
              const result = resolveMission(shipRole, ms.quantity);
              const { outcome, quantityLost, survivors, rewardCredits, rewardMetal, rewardCrystal } = result;

              // update missions status
              await ctx.update(table.missions).set({ status: 'complete' }).where(eq(table.missions.id, ms.id));

              // record processed mission
              const recordValues = {
                id: crypto.randomUUID(),
                missionId: ms.id,
                userId: ms.userId,
                shipTemplateId: ms.shipTemplateId,
                quantity: ms.quantity,
                quantityLost,
                outcome,
                rewardCredits: 0,
                rewardMetal: 0,
                rewardCrystal: 0,
                completedAt: new Date()
              };

              if (features.isFeatureEnabled('MISSION_REWARDS')) {
                recordValues.rewardCredits = rewardCredits;
                recordValues.rewardMetal = rewardMetal;
                recordValues.rewardCrystal = rewardCrystal;
              }

              await ctx.insert(table.processedMissions).values(recordValues);

              // apply rewards to player_state when feature enabled
              if (features.isFeatureEnabled('MISSION_REWARDS')) {
                const state = (await ctx.select().from(table.playerState).where(eq(table.playerState.userId, ms.userId)))[0];
                if (state) {
                  await ctx.update(table.playerState).set({
                    credits: state.credits + rewardCredits,
                    metal: state.metal + rewardMetal,
                    crystal: state.crystal + rewardCrystal
                  }).where(eq(table.playerState.userId, ms.userId));
                }
              }

              // if survivors remain, give them back to player_ships
              if (survivors > 0) {
                const existing = (await ctx.select().from(table.playerShips).where(and(eq(table.playerShips.userId, ms.userId), eq(table.playerShips.shipTemplateId, ms.shipTemplateId))))[0];
                if (existing) {
                  await ctx.update(table.playerShips).set({ quantity: existing.quantity + survivors }).where(eq(table.playerShips.id, existing.id));
                } else {
                  await ctx.insert(table.playerShips).values({ id: crypto.randomUUID(), userId: ms.userId, shipTemplateId: ms.shipTemplateId, quantity: survivors });
                }
              }
            });
          } catch (err) {
            logger.error({ err, missionId: ms.id }, 'Failed resolving mission');
            recordFailure(err);
          }
        }
      } catch (err) {
        logger.error({ err }, 'Mission processing error');
        recordFailure(err);
      }
    } catch (err) {
      logger.error({ err }, 'Build processor error');
      recordFailure(err);
    }
  }, intervalMs);
}
