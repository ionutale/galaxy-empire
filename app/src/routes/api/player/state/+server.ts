import type { RequestHandler } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth';
import { sessionCookieName } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

interface Build {
	id: string;
	type: 'building' | 'ship';
	buildingId?: string | null;
	shipId?: string | null;
	createdAt: string;
	durationSeconds: number;
	status: 'queued' | 'in-progress' | 'completed';
	level?: number | null;
}

export const GET: RequestHandler = async (event) => {
	const token = event.cookies.get(sessionCookieName);
	if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

	const { user } = await validateSessionToken(token);
	if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

	// starter player state
	let stateRow: any = null;
	let ships: any[] = [];
	let builds: Build[] = [];
	let buildingsResult: any[] = [];
	let research: Record<string, { level: number }> = {};
	let buildings: Record<string, number> = {};
	let homePlanet: { systemId: number; orbitIndex: number; systemName: string } | null = null;

	try {
		stateRow = (
			await db.select().from(table.playerState).where(eq(table.playerState.userId, user.id))
		)[0];
		ships = await db.select().from(table.playerShips).where(eq(table.playerShips.userId, user.id));

		const homePlanetResult = await db
			.select({
				systemId: table.planets.systemId,
				orbitIndex: table.planets.orbitIndex,
				systemName: table.systems.name
			})
			.from(table.planets)
			.innerJoin(table.systems, eq(table.planets.systemId, table.systems.id))
			.where(eq(table.planets.ownerId, user.id))
			.limit(1);
		
		if (homePlanetResult.length > 0) {
			homePlanet = homePlanetResult[0];
		}

		const rawBuilds = await db
			.select()
			.from(table.buildQueue)
			.where(eq(table.buildQueue.userId, user.id));

		const processedBuilds = await db
			.select()
			.from(table.processedBuilds)
			.where(eq(table.processedBuilds.userId, user.id));

		buildingsResult = await db
			.select()
			.from(table.playerBuildings)
			.where(eq(table.playerBuildings.userId, user.id));

		const researchResult = await db
			.select()
			.from(table.playerResearch)
			.where(eq(table.playerResearch.userId, user.id));

		// Convert DB research rows to map
		research = researchResult.reduce(
			(acc, r) => {
				acc[r.techId] = { level: r.level };
				return acc;
			},
			{} as Record<string, { level: number }>
		);

		buildings = buildingsResult.reduce(
			(acc, b) => {
				acc[b.buildingId] = b.level;
				return acc;
			},
			{} as Record<string, number>
		);

		// Map DB builds to include 'status' for frontend compatibility
		// We need to simulate the queue to determine the target level for each build
		const tempBuildings = { ...buildings };
		const tempResearch = { ...research };

		// Sort rawBuilds by start time to process in order
		rawBuilds.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());

		const activeBuilds = rawBuilds.map((b) => {
			let level = 0;
			if (b.type === 'building' && b.buildingId) {
				const current = tempBuildings[b.buildingId] ?? 0;
				level = current + 1;
				tempBuildings[b.buildingId] = level;
			} else if (b.type === 'research' && b.techId) {
				const current = tempResearch[b.techId]?.level ?? 0;
				level = current + 1;
				tempResearch[b.techId] = { level };
			}

			return {
				...b,
				type: b.type as 'building' | 'ship',
				status: 'in-progress' as const, // All builds in queue are active
				createdAt: b.startedAt.toISOString(), // Ensure date string format if needed
				durationSeconds: b.totalDuration,
				remainingSeconds: Math.max(0, Math.floor((b.eta.getTime() - Date.now()) / 1000)),
				level // Add calculated level
			};
		});

		const completedBuilds = processedBuilds.map((b) => ({
			id: b.id,
			type: b.type as 'building' | 'ship', // Cast type
			buildingId: b.buildingId,
			shipTemplateId: b.shipTemplateId,
			techId: b.techId,
			quantity: b.quantity,
			status: 'completed' as const,
			createdAt: b.processedAt.toISOString(), // Use processed time as creation time for list sorting
			durationSeconds: 0,
			remainingSeconds: 0,
			level: b.level // Include level from DB
		}));

		builds = [...activeBuilds, ...completedBuilds];

		console.log('[api/player/state] fetched builds for user', user.id, {
			active: activeBuilds.length,
			completed: completedBuilds.length
		});

	} catch (err) {
		// If DB query fails, fallback to empty defaults
		console.warn(
			'player state DB query failed, falling back to defaults',
			err?.toString?.() ?? err
		);
		builds = [];
		research = {};
		stateRow = undefined;
		ships = [];
		buildingsResult = [];
		buildings = {};
	}

	const state = {
		playerId: user.id,
		username: user.username,
		level: stateRow?.level ?? 1,
		power: stateRow?.power ?? 10,
		homeSystem: homePlanet?.systemId ?? 1,
		homePlanet: homePlanet?.orbitIndex ?? 1,
		systemName: homePlanet?.systemName ?? 'Unknown System',
		resources: {
			credits: stateRow?.credits ?? 1000,
			metal: stateRow?.metal ?? 500,
			crystal: stateRow?.crystal ?? 200,
			fuel: stateRow?.fuel ?? 100
		},
		ships,
		builds,
		buildings,
		research
	};

	return new Response(JSON.stringify({ state }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
};
