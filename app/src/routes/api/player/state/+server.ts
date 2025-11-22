import type { RequestHandler } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth';
import { sessionCookieName } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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

	const planetIdParam = event.url.searchParams.get('planetId');

	// starter player state
	let stateRow: any = null;
	let ships: any[] = [];
	let builds: Build[] = [];
	let buildingsResult: any[] = [];
	let research: Record<string, { level: number }> = {};
	let buildings: Record<string, number> = {};
	let currentPlanet: { id: string; systemId: number; orbitIndex: number; systemName: string; name: string } | null = null;

	try {
		stateRow = (
			await db.select().from(table.playerState).where(eq(table.playerState.userId, user.id))
		)[0];
		ships = await db.select().from(table.playerShips).where(eq(table.playerShips.userId, user.id));

		// Determine which planet to show
		const conditions = [eq(table.planets.ownerId, user.id)];
		if (planetIdParam) {
			conditions.push(eq(table.planets.id, planetIdParam));
		}

		const planetQuery = db
			.select({
				id: table.planets.id,
				systemId: table.planets.systemId,
				orbitIndex: table.planets.orbitIndex,
				systemName: table.systems.name,
				name: table.planets.name
			})
			.from(table.planets)
			.innerJoin(table.systems, eq(table.planets.systemId, table.systems.id))
			.where(and(...conditions));

		// Fetch all owned planets
		const ownedPlanets = await db
			.select({
				id: table.planets.id,
				systemId: table.planets.systemId,
				orbitIndex: table.planets.orbitIndex,
				systemName: table.systems.name,
				name: table.planets.name,
				type: table.planets.type
			})
			.from(table.planets)
			.innerJoin(table.systems, eq(table.planets.systemId, table.systems.id))
			.where(eq(table.planets.ownerId, user.id));

		// Determine current planet
		if (planetIdParam) {
			currentPlanet = ownedPlanets.find(p => p.id === planetIdParam) || null;
		}
		if (!currentPlanet && ownedPlanets.length > 0) {
			currentPlanet = ownedPlanets[0];
		} else if (!currentPlanet) {
			// Fallback logic for new users (same as before but simplified)
			// ... (existing fallback logic if needed, but registration should handle it now)
		}

		// ... (existing fallback logic if needed)

		const rawBuilds = await db
			.select()
			.from(table.buildQueue)
			.where(eq(table.buildQueue.userId, user.id));

		const processedBuilds = await db
			.select()
			.from(table.processedBuilds)
			.where(eq(table.processedBuilds.userId, user.id))
			.orderBy(desc(table.processedBuilds.processedAt))
			.limit(10);

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

		// Filter buildings for current planet (or null for legacy)
		buildings = buildingsResult.reduce(
			(acc, b) => {
				if (!b.planetId || (currentPlanet && b.planetId === currentPlanet.id)) {
					acc[b.buildingId] = b.level;
				}
				return acc;
			},
			{} as Record<string, number>
		);

		// ... (rest of build processing)

		const state = {
			playerId: user.id,
			username: user.username,
			level: stateRow?.level ?? 1,
			power: stateRow?.power ?? 10,
			homeSystem: currentPlanet ? currentPlanet.systemId : 1,
			homePlanet: currentPlanet ? currentPlanet.orbitIndex : 1,
			systemName: currentPlanet?.systemName ?? 'Unknown System',
			planetName: currentPlanet?.name ?? 'Unknown Planet',
			planetId: currentPlanet?.id,
			planets: ownedPlanets, // Add planets list
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
	} catch (e) {
		console.error('Failed to load player state', e);
		return new Response(JSON.stringify({ error: 'internal_server_error' }), { status: 500 });
	}
};
