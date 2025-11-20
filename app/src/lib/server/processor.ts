// Removed demoStorage import; using DB for builds
import { RESEARCH_DATA, BUILDING_DATA, SHIP_TEMPLATES } from '$lib/data/gameData';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { simulateCombat } from '$lib/server/combat/engine';

// const BUILDS_FILE removed; builds are stored in DB
// Builds are stored in DB; no file constant needed
const PLAYER_FILE = 'player.json';

export interface BuildEntry {
	id: string;
	type?: string;
	createdAt: string;
	status: string;
	durationSeconds?: number;
	result?: unknown;
	[k: string]: unknown;
}
export interface FleetEntry {
	id: string;
	createdAt: string;
	etaSeconds: number;
	status: string;
	ships?: Record<string, number>;
	origin?: string;
	destination?: string;
	targetIsNpc?: boolean;
	[k: string]: unknown;
}
export type Player = {
	playerId?: string;
	displayName?: string;
	ships?: Record<string, number>;
	resources?: Record<string, number>;
	buildings?: Record<string, number>;
	research?: Record<string, { level: number }>;
	[k: string]: unknown;
} | null;


export async function processBuilds(tickSeconds = 5) {
	const builds = await db.select().from(table.buildQueue).execute();
	// const player = ... // We don't fetch a single player anymore as we process multiple users
	const now = Date.now();
	const processed: BuildEntry[] = [];
	let changed = false;

	// We will fetch player data on demand inside the loop or refactor to batch fetch if needed.
	// For now, fetching inside the loop is acceptable for low volume.
	// Actually, we don't need 'player' object for most logic as we use DB directly.
	// The only place 'player' was used was for in-memory updates which we removed.
	const player = null; // Placeholder to minimize diff changes in subsequent lines if any remain

	for (const b of builds) {
		// Check if build is complete based on ETA
		if (b.eta.getTime() <= now) {
			try {
				console.debug('[processor] build complete', { id: b.id, type: b.type, eta: b.eta });
			} catch (e) {
				// ignore
			}

			// determine the user id for this build entry (prefer explicit b.userId)
			// player is the DB row from playerState, so it has userId
			const entryUserId = b.userId || 'demo_user';

			// apply to player: handle building upgrades and ship builds
			if (b.type === 'building' && b.buildingId) {
				const buildingId = b.buildingId;
				// In-memory update removed as we update DB directly and don't return player state here

				try {
					const rows = await db
						.select()
						.from(table.playerBuildings)
						.where(eq(table.playerBuildings.userId, entryUserId));
					const existing = rows.find((r: any) => r.buildingId === buildingId);
					if (existing) {
						await db
							.update(table.playerBuildings)
							.set({ level: existing.level + 1 })
							.where(eq(table.playerBuildings.id, existing.id));
					} else {
						await db
							.insert(table.playerBuildings)
							.values({ id: crypto.randomUUID(), userId: entryUserId, buildingId, level: 1 });
					}
					// record processed build
					await db.insert(table.processedBuilds).values({
						id: crypto.randomUUID(),
						userId: entryUserId,
						type: 'building',
						buildingId: buildingId,
						quantity: 1,
						processedAt: new Date()
					});
					// Remove from buildQueue
					await db.delete(table.buildQueue).where(eq(table.buildQueue.id, b.id));
				} catch (err) {
					console.error('db playerBuildings sync error', err);
				}
			} else if (b.type === 'research' && b.techId) {
				const techId = b.techId;
				// In-memory update removed

				try {
					const rows = await db
						.select()
						.from(table.playerResearch)
						.where(eq(table.playerResearch.userId, entryUserId));
					const existing = rows.find((r: any) => r.techId === techId);
					if (existing) {
						await db
							.update(table.playerResearch)
							.set({ level: existing.level + 1 })
							.where(eq(table.playerResearch.id, existing.id));
					} else {
						await db
							.insert(table.playerResearch)
							.values({ id: crypto.randomUUID(), userId: entryUserId, techId, level: 1 });
					}
					// record processed build
					await db.insert(table.processedBuilds).values({
						id: crypto.randomUUID(),
						userId: entryUserId,
						type: 'research',
						techId: techId,
						quantity: 1,
						processedAt: new Date()
					});
					// Remove from buildQueue
					await db.delete(table.buildQueue).where(eq(table.buildQueue.id, b.id));
				} catch (err) {
					console.error('db playerResearch sync error', err);
				}
			} else {
				// fallback: if build has a type string treat it as ship type or shipType field
				// In DB schema, type is 'ship' and shipTemplateId is set
				const t = b.shipTemplateId;
				const count = b.quantity;
				if (t) {
					// In-memory update removed

					try {
						const existing = (
							await db
								.select()
								.from(table.playerShips)
								.where(eq(table.playerShips.userId, entryUserId))
						).find((s: any) => s.shipTemplateId === t);
						if (existing) {
							await db
								.update(table.playerShips)
								.set({ quantity: existing.quantity + count })
								.where(eq(table.playerShips.id, existing.id));
						} else {
							await db.insert(table.playerShips).values({
								id: crypto.randomUUID(),
								userId: entryUserId,
								shipTemplateId: t,
								quantity: count
							});
						}
						// record processed build
						await db.insert(table.processedBuilds).values({
							id: crypto.randomUUID(),
							userId: entryUserId,
							type: 'ship',
							shipTemplateId: t,
							quantity: count,
							processedAt: new Date()
						});
						// Remove from buildQueue
						await db.delete(table.buildQueue).where(eq(table.buildQueue.id, b.id));
					} catch (err) {
						// ignore db errors to keep demo running
						console.error('db sync error', err);
					}
				}
			}

			// Add to processed list for return (mapped to BuildEntry interface if needed, or just the DB row)
			// The BuildEntry interface expects status, result etc. We can synthesize them.
			processed.push({
				id: b.id,
				type: b.type,
				createdAt: b.startedAt.toISOString(),
				status: 'complete',
				durationSeconds: b.totalDuration,
				result: { success: true }
			});
			changed = true;
		}
	}

	if (changed) {
		// DB persistence already handled; no file writes needed
	}

	return { processed };
}

export async function processFleets(tickSeconds = 5) {
	const now = new Date();
	const activeFleets = await db
		.select()
		.from(table.fleets)
		.where(eq(table.fleets.status, 'active'));
	const returningFleets = await db
		.select()
		.from(table.fleets)
		.where(eq(table.fleets.status, 'returning'));

	const processed: any[] = [];

	// 1. Process active fleets arriving at destination
	for (const f of activeFleets) {
		if (f.arrivalTime <= now) {
			console.log(`[processor] Fleet ${f.id} arrived at destination`);

			// Handle mission logic
			if (f.mission === 'transport') {
				// Drop cargo (just vanish for now, or add to target if target is user's)
				// For simplicity in this phase: Transport just returns home immediately
				// In future: Add to target planet resources
			} else if (f.mission === 'attack') {
				// Combat logic
				const targetPlanet = await db
					.select()
					.from(table.planets)
					.where(and(eq(table.planets.systemId, f.targetSystem), eq(table.planets.orbitIndex, f.targetPlanet)))
					.limit(1);

				const defenderId = targetPlanet[0]?.ownerId;
				let combatResult = null;

				if (defenderId) {
					// Fetch defender ships (all ships for now)
					const defenderShips = await db
						.select()
						.from(table.playerShips)
						.where(eq(table.playerShips.userId, defenderId));
					const defenderComp: Record<string, number> = {};
					for (const s of defenderShips) {
						defenderComp[s.shipTemplateId] = s.quantity;
					}

					// Simulate combat
					combatResult = simulateCombat(
						f.userId,
						f.composition as Record<string, number>,
						defenderId,
						defenderComp
					);

					// Save report
					await db.insert(table.combatReports).values({
						id: crypto.randomUUID(),
						attackerId: f.userId,
						defenderId: defenderId,
						timestamp: now,
						outcome: combatResult.outcome,
						log: combatResult.log,
						loot: combatResult.loot
					});

					// Apply losses to Attacker (Fleet)
					const newComposition = { ...(f.composition as Record<string, number>) };
					for (const [shipId, lost] of Object.entries(combatResult.attackerLosses)) {
						if (newComposition[shipId]) {
							newComposition[shipId] -= lost;
							if (newComposition[shipId] <= 0) delete newComposition[shipId];
						}
					}
					// Update fleet composition in DB (will be used for return or deletion if empty)
					// If fleet is empty, it's destroyed?
					// For now, let's keep it returning even if empty (ghost fleet) or delete it?
					// Logic below handles return. We should update `f.composition` or the DB update below.
					// We'll update the DB update below to use the new composition.

					// Apply losses to Defender (PlayerShips)
					for (const [shipId, lost] of Object.entries(combatResult.defenderLosses)) {
						const existing = defenderShips.find((s) => s.shipTemplateId === shipId);
						if (existing) {
							const newQty = existing.quantity - lost;
							if (newQty <= 0) {
								await db.delete(table.playerShips).where(eq(table.playerShips.id, existing.id));
							} else {
								await db
									.update(table.playerShips)
									.set({ quantity: newQty })
									.where(eq(table.playerShips.id, existing.id));
							}
						}
					}

					// Handle Loot (Steal from defender)
					if (combatResult.outcome === 'attacker_win' && combatResult.loot) {
						// Deduct from defender
						const defState = (
							await db.select().from(table.playerState).where(eq(table.playerState.userId, defenderId))
						)[0];
						if (defState) {
							await db
								.update(table.playerState)
								.set({
									metal: Math.max(0, defState.metal - (combatResult.loot.metal || 0)),
									crystal: Math.max(0, defState.crystal - (combatResult.loot.crystal || 0)),
									fuel: Math.max(0, defState.fuel - (combatResult.loot.fuel || 0))
								})
								.where(eq(table.playerState.userId, defenderId));
						}
						// Add to fleet cargo (handled in return update below)
					}
				}

				// Update fleet for return
				const returnDuration = f.arrivalTime.getTime() - Number(f.id.split('-').pop()!) || 10000;
				const returnTime = new Date(now.getTime() + 60000); // Mock return time

				// Calculate new composition and cargo
				// Calculate new composition and cargo
				const finalComposition = combatResult ?
					Object.entries(f.composition as Record<string, number>).reduce((acc, [k, v]) => {
						const lost = combatResult?.attackerLosses[k] || 0;
						if (v - lost > 0) acc[k] = v - lost;
						return acc;
					}, {} as Record<string, number>)
					: f.composition;

				// Calculate max cargo capacity of surviving fleet
				let maxCapacity = 0;
				for (const [shipId, count] of Object.entries(finalComposition)) {
					const template = SHIP_TEMPLATES.find(t => t.shipId === shipId);
					if (template) maxCapacity += (template.capacity || 0) * count;
				}

				// Cap loot based on capacity
				const loot = combatResult?.loot || { metal: 0, crystal: 0, fuel: 0 };
				let totalLoot = (loot.metal || 0) + (loot.crystal || 0) + (loot.fuel || 0);

				if (totalLoot > maxCapacity) {
					const ratio = maxCapacity / totalLoot;
					loot.metal = Math.floor((loot.metal || 0) * ratio);
					loot.crystal = Math.floor((loot.crystal || 0) * ratio);
					loot.fuel = Math.floor((loot.fuel || 0) * ratio);
				}

				const finalCargo = loot;

				await db
					.update(table.fleets)
					.set({
						status: 'returning',
						returnTime: returnTime,
						composition: finalComposition,
						cargo: finalCargo
					})
					.where(eq(table.fleets.id, f.id));

				processed.push({ ...f, status: 'arrived', combatResult });
				continue; // Skip the default return logic below
			}

			// Return fleet
			const returnDuration = f.arrivalTime.getTime() - Number(f.id.split('-').pop()!) || 10000; // Hacky duration recovery or recalc
			// Better: Recalculate based on distance. For now, assume same time back.
			// We need to store start time or duration to know return time accurately.
			// Let's just use a fixed return time for now or recalc if we had coords.
			// We'll assume return takes same amount of time as outbound.
			// Since we don't have start time, we can't easily calc duration without coords.
			// Let's just set return time to now + 1 minute for demo.
			const returnTime = new Date(now.getTime() + 60000);

			await db
				.update(table.fleets)
				.set({
					status: 'returning',
					returnTime: returnTime,
					cargo: {} // Cargo dropped
				})
				.where(eq(table.fleets.id, f.id));

			processed.push({ ...f, status: 'arrived' });
		}
	}

	// 2. Process returning fleets arriving home
	for (const f of returningFleets) {
		if (f.returnTime && f.returnTime <= now) {
			console.log(`[processor] Fleet ${f.id} returned home`);

			// Restore ships to player
			const composition = f.composition as Record<string, number>;
			const userId = f.userId;

			try {
				const playerShips = await db
					.select()
					.from(table.playerShips)
					.where(eq(table.playerShips.userId, userId));

				for (const [shipId, count] of Object.entries(composition)) {
					const existing = playerShips.find((s) => s.shipTemplateId === shipId);
					if (existing) {
						await db
							.update(table.playerShips)
							.set({ quantity: existing.quantity + count })
							.where(eq(table.playerShips.id, existing.id));
					} else {
						await db
							.insert(table.playerShips)
							.values({ id: crypto.randomUUID(), userId, shipTemplateId: shipId, quantity: count });
					}
				}

				// Restore any cargo brought back (e.g. from recycle/attack)
				const cargo = f.cargo as Record<string, number>;
				if (cargo && (cargo.metal || cargo.crystal || cargo.fuel)) {
					const playerState = (
						await db.select().from(table.playerState).where(eq(table.playerState.userId, userId))
					)[0];
					if (playerState) {
						await db
							.update(table.playerState)
							.set({
								metal: playerState.metal + (cargo.metal || 0),
								crystal: playerState.crystal + (cargo.crystal || 0),
								fuel: playerState.fuel + (cargo.fuel || 0)
							})
							.where(eq(table.playerState.userId, userId));
					}
				}

				// Delete fleet
				await db.delete(table.fleets).where(eq(table.fleets.id, f.id));
				processed.push({ ...f, status: 'returned' });
			} catch (err) {
				console.error('Error restoring fleet:', err);
			}
		}
	}

	return { processed };
}

export async function processTick(tickSeconds = 5) {
	const buildsRes = await processBuilds(tickSeconds);
	const fleetsRes = await processFleets(tickSeconds);
	const researchRes = await processResearch(tickSeconds);
	const productionRes = await processProduction(tickSeconds);
	return {
		builds: buildsRes.processed,
		fleets: fleetsRes.processed,
		research: researchRes.processed
	};
}

export async function processProduction(tickSeconds = 5) {
	// Fetch all player states
	const allPlayers = await db.select().from(table.playerState);

	// Fetch all buildings and ships (could be optimized to batch fetch but fine for now)
	const allBuildings = await db.select().from(table.playerBuildings);
	const allShips = await db.select().from(table.playerShips);

	const producedTotal: Record<string, any> = {};

	for (const playerRow of allPlayers) {
		const userId = playerRow.userId;

		// Filter for this user
		const userBuildings = allBuildings.filter(b => b.userId === userId);
		const userShips = allShips.filter(s => s.userId === userId);

		const buildings: Record<string, number> = {};
		for (const b of userBuildings) {
			buildings[b.buildingId] = b.level;
		}

		const ships: Record<string, number> = {};
		for (const s of userShips) {
			ships[s.shipTemplateId] = s.quantity;
		}

		const produced: Record<string, number> = {};

		// building-based production
		for (const [bid, def] of Object.entries(BUILDING_DATA)) {
			if (typeof def.production === 'function') {
				const lvl = Number(buildings[bid] ?? 0);
				if (lvl > 0) {
					const perHour = def.production(lvl);
					const perTick = Math.floor((perHour / 3600) * tickSeconds);
					if (bid === 'metalMine') produced.metal = (produced.metal ?? 0) + perTick;
					if (bid === 'crystalSynthesizer') produced.crystal = (produced.crystal ?? 0) + perTick;
					if (bid === 'deuteriumRefinery') produced.fuel = (produced.fuel ?? 0) + perTick;
					if (bid === 'controlCenter') produced.credits = (produced.credits ?? 0) + perTick;
				}
			}
		}

		// ship-based mining
		const miningTemplate = SHIP_TEMPLATES.find((s) => s.shipId === 'miningVessel');
		if (miningTemplate && typeof miningTemplate.miningRate === 'number') {
			const count = Number(ships['miningVessel'] ?? 0);
			if (count > 0) {
				const perHour = miningTemplate.miningRate * count;
				const perTick = Math.floor((perHour / 3600) * tickSeconds);
				produced.metal = (produced.metal ?? 0) + perTick;
			}
		}

		// Update DB if production occurred
		if (Object.keys(produced).length > 0) {
			try {
				await db
					.update(table.playerState)
					.set({
						metal: playerRow.metal + (produced.metal || 0),
						crystal: playerRow.crystal + (produced.crystal || 0),
						fuel: playerRow.fuel + (produced.fuel || 0),
						credits: playerRow.credits + (produced.credits || 0)
					})
					.where(eq(table.playerState.userId, userId));

				producedTotal[userId] = produced;
			} catch (err) {
				console.error(`db production sync error for ${userId}`, err);
			}
		}
	}

	return { produced: producedTotal };
}

export async function processResearch(tickSeconds = 5) {
	// Research is now handled via the buildQueue in processBuilds.
	// This function is kept for compatibility but does no processing.
	return { processed: [] };
}
