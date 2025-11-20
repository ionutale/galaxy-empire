import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { SHIP_TEMPLATES } from '$lib/data/gameData';

export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	const userId = locals.user.id;
	const { targetSystem, targetPlanet, mission, ships, cargo } = await request.json();

	// 1. Validate inputs
	if (!targetSystem || !targetPlanet || !mission || !ships || Object.keys(ships).length === 0) {
		return json({ error: 'Invalid fleet parameters' }, { status: 400 });
	}

	// 2. Fetch player ships and resources
	const playerShips = await db
		.select()
		.from(table.playerShips)
		.where(eq(table.playerShips.userId, userId));
	const playerState = (
		await db.select().from(table.playerState).where(eq(table.playerState.userId, userId))
	)[0];

	if (!playerState) return json({ error: 'Player not found' }, { status: 404 });

	// 3. Validate ship availability and calculate fleet stats
	let minSpeed = 999999;
	let totalCargoCapacity = 0;
	const fleetComposition: Record<string, number> = {};

	for (const [shipId, count] of Object.entries(ships)) {
		const quantity = Number(count);
		if (quantity <= 0) continue;

		const owned = playerShips.find((s) => s.shipTemplateId === shipId);
		if (!owned || owned.quantity < quantity) {
			return json({ error: `Not enough ships: ${shipId}` }, { status: 400 });
		}

		const template = SHIP_TEMPLATES.find((t) => t.shipId === shipId);
		if (!template) return json({ error: `Invalid ship type: ${shipId}` }, { status: 400 });

		minSpeed = Math.min(minSpeed, template.speed || 100);
		totalCargoCapacity += (template.capacity || 0) * quantity;
		fleetComposition[shipId] = quantity;
	}

	if (Object.keys(fleetComposition).length === 0) {
		return json({ error: 'No valid ships selected' }, { status: 400 });
	}

	// 4. Validate cargo
	const metal = Number(cargo?.metal || 0);
	const crystal = Number(cargo?.crystal || 0);
	const fuel = Number(cargo?.fuel || 0);
	const totalCargo = metal + crystal + fuel;

	if (totalCargo > totalCargoCapacity) {
		return json({ error: 'Cargo exceeds fleet capacity' }, { status: 400 });
	}

	if (playerState.metal < metal || playerState.crystal < crystal || playerState.fuel < fuel) {
		return json({ error: 'Not enough resources' }, { status: 400 });
	}

	// 5. Calculate travel time
	// Distance formula: sqrt((x2-x1)^2 + (y2-y1)^2). For now, assume origin is (1,1).
	// TODO: Get actual origin coordinates from DB when Galaxy Map is implemented.
	const originSystem = 1;
	const originPlanet = 1;

	// Simple distance metric: |d_system| * 1000 + |d_planet| * 10
	// This is a placeholder. Real distance needs galaxy coordinates.
	const dist =
		Math.abs(targetSystem - originSystem) * 20000 +
		Math.abs(targetPlanet - originPlanet) * 200 +
		1000;
	const travelSeconds = Math.max(10, Math.ceil(dist / minSpeed));

	const now = new Date();
	const arrivalTime = new Date(now.getTime() + travelSeconds * 1000);

	try {
		// 6. Deduct ships and resources
		// Update resources
		await db
			.update(table.playerState)
			.set({
				metal: playerState.metal - metal,
				crystal: playerState.crystal - crystal,
				fuel: playerState.fuel - fuel
			})
			.where(eq(table.playerState.userId, userId));

		// Update ships
		for (const [shipId, count] of Object.entries(fleetComposition)) {
			const owned = playerShips.find((s) => s.shipTemplateId === shipId)!;
			if (owned.quantity === count) {
				await db.delete(table.playerShips).where(eq(table.playerShips.id, owned.id));
			} else {
				await db
					.update(table.playerShips)
					.set({ quantity: owned.quantity - count })
					.where(eq(table.playerShips.id, owned.id));
			}
		}

		// 7. Create fleet
		await db.insert(table.fleets).values({
			id: crypto.randomUUID(),
			userId,
			originSystem,
			originPlanet,
			targetSystem: Number(targetSystem),
			targetPlanet: Number(targetPlanet),
			mission,
			status: 'active',
			arrivalTime,
			composition: fleetComposition,
			cargo: { metal, crystal, fuel }
		});

		return json({ success: true, message: 'Fleet dispatched', arrivalTime });
	} catch (err) {
		console.error('Error dispatching fleet:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
