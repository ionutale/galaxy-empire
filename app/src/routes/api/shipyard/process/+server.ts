import type { RequestHandler } from '@sveltejs/kit';
import { sessionCookieName, validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { recordFailure } from '$lib/server/metrics';

const DEFAULT_RETRY_ATTEMPTS = 3;

export const POST: RequestHandler = async (event) => {
	const token = event.cookies.get(sessionCookieName);
	if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

	const { user } = await validateSessionToken(token);
	if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

	const now = new Date();
	const items = await db
		.select()
		.from(table.buildQueue)
		.where(and(eq(table.buildQueue.userId, user.id), eq(table.buildQueue.type, 'ship')));
	const completed = items.filter((i) => new Date(i.eta).getTime() <= now.getTime());

	for (const item of completed) {
		try {
			const { retryAsync } = await import('$lib/server/retry');
			await retryAsync(
				async () => {
					if (!item.shipTemplateId) {
						throw new Error('Ship template ID missing for ship build');
					}
					const existing = (
						await db.select().from(table.playerShips).where(eq(table.playerShips.userId, user.id))
					).find((s) => s.shipTemplateId === item.shipTemplateId);
					if (existing) {
						await db
							.update(table.playerShips)
							.set({ quantity: existing.quantity + item.quantity })
							.where(eq(table.playerShips.id, existing.id));
					} else {
						await db.insert(table.playerShips).values({
							id: crypto.randomUUID(),
							userId: user.id,
							shipTemplateId: item.shipTemplateId,
							quantity: item.quantity
						});
					}
					await db.insert(table.processedBuilds).values({
						id: crypto.randomUUID(),
						userId: user.id,
						shipTemplateId: item.shipTemplateId,
						quantity: item.quantity,
						processedAt: new Date()
					});
					await db.delete(table.buildQueue).where(eq(table.buildQueue.id, item.id));
				},
				DEFAULT_RETRY_ATTEMPTS,
				200,
				2
			);
		} catch (err) {
			console.error('Failed processing build item after retries', err);
			recordFailure(err);
		}
	}

	return new Response(JSON.stringify({ processed: completed.length }), {
		headers: { 'content-type': 'application/json' }
	});
};
