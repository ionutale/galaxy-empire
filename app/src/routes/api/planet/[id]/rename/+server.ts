import type { RequestHandler } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth';
import { sessionCookieName } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
	const token = event.cookies.get(sessionCookieName);
	if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

	const { user } = await validateSessionToken(token);
	if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

	const planetId = event.params.id;
	if (!planetId) return new Response(JSON.stringify({ error: 'missing_id' }), { status: 400 });

	const body = await event.request.json();
	const newName = String(body.name || '').trim();

	if (!newName || newName.length > 30) {
		return new Response(JSON.stringify({ error: 'invalid_name' }), { status: 400 });
	}

	// Verify ownership
	const planet = await db
		.select()
		.from(table.planets)
		.where(and(eq(table.planets.id, planetId), eq(table.planets.ownerId, user.id)))
		.limit(1);

	if (planet.length === 0) {
		return new Response(JSON.stringify({ error: 'not_found_or_unauthorized' }), { status: 404 });
	}

	await db
		.update(table.planets)
		.set({ name: newName })
		.where(eq(table.planets.id, planetId));

	return new Response(JSON.stringify({ success: true, name: newName }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
};
