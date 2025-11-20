import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';

function isAdmin(event: Request) {
	const key = event.headers.get('x-admin-key') || '';
	return env.ADMIN_KEY && key === env.ADMIN_KEY;
}

export const GET: RequestHandler = async ({ request }) => {
	if (!isAdmin(request)) return new Response(null, { status: 403 });
	const items = await db.select().from(table.processedMissions);
	return new Response(JSON.stringify({ items }), {
		headers: { 'content-type': 'application/json' }
	});
};
