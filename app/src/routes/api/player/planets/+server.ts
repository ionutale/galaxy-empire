import type { RequestHandler } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth';
import { sessionCookieName } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
	const token = event.cookies.get(sessionCookieName);
	if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

	const { user } = await validateSessionToken(token);
	if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

	const planets = await db
		.select({
			id: table.planets.id,
			name: table.planets.name,
			systemId: table.planets.systemId,
			orbitIndex: table.planets.orbitIndex,
			type: table.planets.type,
			systemName: table.systems.name,
			x: table.systems.x,
			y: table.systems.y
		})
		.from(table.planets)
		.innerJoin(table.systems, eq(table.planets.systemId, table.systems.id))
		.where(eq(table.planets.ownerId, user.id));

	return new Response(JSON.stringify({ planets }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
};
