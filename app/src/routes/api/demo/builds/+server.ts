import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

interface BuildEntry {
	id: string;
	type?: string;
	createdAt: string;
	status: string;
	[k: string]: unknown;
}

export const GET: RequestHandler = async () => {
	const builds = await db
		.select()
		.from(table.buildQueue)
		.where(eq(table.buildQueue.userId, 'demo_user'));
	return new Response(JSON.stringify({ builds }), {
		headers: { 'Content-Type': 'application/json' }
	});
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const id = 'b_' + Date.now();
		const entry = {
			id,
			...body,
			createdAt: new Date().toISOString(),
			status: 'queued',
			userId: 'demo_user'
		};
		await db.insert(table.buildQueue).values(entry);
		return new Response(JSON.stringify({ build: entry }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch {
		return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
	}
};
