import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
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
      const items = await db.select().from(table.buildQueue).all();
      const due = items.filter((i) => new Date(i.eta).getTime() <= now.getTime());
      let processed = 0;
      for (const item of due) {
        try {
          const { retryAsync } = await import('$lib/server/retry');
          await retryAsync(async () => {
            db.transaction((ctx) => {
              const existingRows = ctx.select().from(table.playerShips).where(eq(table.playerShips.userId, item.userId)).all();
              const existing = existingRows.find((s) => s.shipTemplateId === item.shipTemplateId);
              if (existing) {
                ctx.update(table.playerShips).set({ quantity: existing.quantity + item.quantity }).where(eq(table.playerShips.id, existing.id)).run();
              } else {
                ctx.insert(table.playerShips).values({ id: crypto.randomUUID(), userId: item.userId, shipTemplateId: item.shipTemplateId, quantity: item.quantity }).run();
              }
              ctx.insert(table.processedBuilds).values({ id: crypto.randomUUID(), userId: item.userId, shipTemplateId: item.shipTemplateId, quantity: item.quantity, processedAt: new Date() }).run();
              ctx.delete(table.buildQueue).where(eq(table.buildQueue.id, item.id)).run();
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
        const missions = await db.select().from(table.missions).all();
        const dueMissions = missions.filter((m) => new Date(m.eta).getTime() <= Date.now() && m.status === 'in_progress');
        for (const ms of dueMissions) {
          try {
            db.transaction((ctx) => {
              // determine ship role from template and resolve mission
              const tmpl = ctx.select().from(table.shipTemplate).where(eq(table.shipTemplate.id, ms.shipTemplateId)).all()[0];
              const shipRole = tmpl?.role;
              const result = resolveMission(shipRole, ms.quantity);
              const { outcome, quantityLost, survivors, rewardCredits, rewardMetal, rewardCrystal } = result;

              // update missions status
              ctx.update(table.missions).set({ status: 'complete' }).where(eq(table.missions.id, ms.id)).run();

              // record processed mission (only include rewards when enabled)
              type RecordValues = {
                id: string;
                missionId: string;
                userId: string;
                shipTemplateId: string;
                quantity: number;
                quantityLost: number;
                outcome: string;
                rewardCredits?: number;
                rewardMetal?: number;
                rewardCrystal?: number;
                completedAt: Date;
              };

              const recordValues: RecordValues = { id: crypto.randomUUID(), missionId: ms.id, userId: ms.userId, shipTemplateId: ms.shipTemplateId, quantity: ms.quantity, quantityLost, outcome, completedAt: new Date() };
              if (features.isFeatureEnabled('MISSION_REWARDS')) {
                recordValues.rewardCredits = rewardCredits;
                recordValues.rewardMetal = rewardMetal;
                recordValues.rewardCrystal = rewardCrystal;
              }
              ctx.insert(table.processedMissions).values(recordValues).run();

              // apply rewards to player_state when feature enabled
              if (features.isFeatureEnabled('MISSION_REWARDS')) {
                const state = ctx.select().from(table.playerState).where(eq(table.playerState.userId, ms.userId)).all()[0];
                if (state) {
                  ctx.update(table.playerState).set({ credits: state.credits + rewardCredits, metal: state.metal + rewardMetal, crystal: state.crystal + rewardCrystal }).where(eq(table.playerState.userId, ms.userId)).run();
                }
              }

              // if survivors remain, give them back to player_ships
              if (survivors > 0) {
                const existing = ctx.select().from(table.playerShips).where(eq(table.playerShips.userId, ms.userId)).all().find((s) => s.shipTemplateId === ms.shipTemplateId);
                if (existing) {
                  ctx.update(table.playerShips).set({ quantity: existing.quantity + survivors }).where(eq(table.playerShips.id, existing.id)).run();
                } else {
                  ctx.insert(table.playerShips).values({ id: crypto.randomUUID(), userId: ms.userId, shipTemplateId: ms.shipTemplateId, quantity: survivors }).run();
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
