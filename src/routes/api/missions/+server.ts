import type { RequestHandler } from '@sveltejs/kit';
import { sessionCookieName, validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
	const token = event.cookies.get(sessionCookieName);
	if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

	const { user } = await validateSessionToken(token);
	if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

	const missions = await db.select().from(table.missions).where(eq(table.missions.userId, user.id));
	// attach processed records if completed
	const missionIds = new Set(missions.map((m) => m.id));
	const allProcessed = await db
		.select()
		.from(table.processedMissions)
		.where(eq(table.processedMissions.userId, user.id));
	const processed = allProcessed.filter((p) => missionIds.has(p.missionId));

	return new Response(JSON.stringify({ missions, processed }), {
		headers: { 'content-type': 'application/json' }
	});
};
