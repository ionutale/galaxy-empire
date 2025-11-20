import type { RequestHandler } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { hash } from '@node-rs/argon2';
import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
	const { request } = event;
	const body = await request.json();
	const username = String(body.username || '').trim();
	const password = String(body.password || '');

	if (!username || password.length < 6) {
		return new Response(JSON.stringify({ error: 'invalid_input' }), { status: 400 });
	}

	// check unique
	const existing = await db
		.select({ id: table.user.id })
		.from(table.user)
		.where(eq(table.user.username, username));
	if (existing.length > 0) {
		return new Response(JSON.stringify({ error: 'username_taken' }), { status: 409 });
	}

	const id = crypto.randomUUID();
	const passwordHash = await hash(password);

	try {
		await db.transaction(async (ctx) => {
			await ctx.insert(table.user).values({ id, username, passwordHash });

			// create default player state with starting resources
			await ctx.insert(table.playerState).values({
				userId: id,
				level: 1,
				power: 10,
				credits: 1500,
				metal: 1000,
				crystal: 500,
				fuel: 200
			});

			// Find a starting planet (prefer terrestrial, owned by NPC or unowned)
			// We assume 'npc_faction' owns all generated planets initially.
			const starterPlanet = await ctx
				.select()
				.from(table.planets)
				.where(and(eq(table.planets.ownerId, 'npc_faction'), eq(table.planets.type, 'terrestrial')))
				.limit(1);
			
			let planetIdToAssign: string | null = null;

			if (starterPlanet.length > 0) {
				planetIdToAssign = starterPlanet[0].id;
			} else {
				// Fallback to any planet if no terrestrial available
				const anyPlanet = await ctx
					.select()
					.from(table.planets)
					.where(eq(table.planets.ownerId, 'npc_faction'))
					.limit(1);
				if (anyPlanet.length > 0) {
					planetIdToAssign = anyPlanet[0].id;
				}
			}

			if (planetIdToAssign) {
				await ctx
					.update(table.planets)
					.set({ ownerId: id })
					.where(eq(table.planets.id, planetIdToAssign));
			} else {
				console.warn('No starter planet found for user', id);
			}

			// create default starting buildings: give new players some basic structures at level 1
			await ctx.insert(table.playerBuildings).values([
				{ id: crypto.randomUUID(), userId: id, buildingId: 'controlCenter', level: 1 },
				{ id: crypto.randomUUID(), userId: id, buildingId: 'metalMine', level: 1 },
				{ id: crypto.randomUUID(), userId: id, buildingId: 'crystalSynthesizer', level: 1 },
				{ id: crypto.randomUUID(), userId: id, buildingId: 'metalStorage', level: 1 },
				{ id: crypto.randomUUID(), userId: id, buildingId: 'crystalStorage', level: 1 }
			]);
		});
	} catch (err) {
		console.error('Failed to register user transactionally', err);
		return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500 });
	}

	const token = generateSessionToken();
	const session = await createSession(token, id);

	setSessionTokenCookie(event, token, session.expiresAt);

	return new Response(JSON.stringify({ user: { id, username } }), {
		status: 201,
		headers: { 'content-type': 'application/json' }
	});
};
