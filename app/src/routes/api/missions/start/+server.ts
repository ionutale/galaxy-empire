import type { RequestHandler } from '@sveltejs/kit';
import { sessionCookieName, validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
	const token = event.cookies.get(sessionCookieName);
	if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

	const { user } = await validateSessionToken(token);
	if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

	const body = await event.request.json();
	const shipTemplateId = String(body.shipTemplateId || '');
	const quantity = Number(body.quantity || 1);

	if (!shipTemplateId || quantity < 1)
		return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });

	try {
		// deduct ships and create mission transactionally
		await db.transaction(async (ctx) => {
			const [existing] = await ctx
				.select()
				.from(table.playerShips)
				.where(
					and(
						eq(table.playerShips.userId, user.id),
						eq(table.playerShips.shipTemplateId, shipTemplateId)
					)
				);

			if (!existing || existing.quantity < quantity) {
				throw new Error('insufficient_ships');
			}

			const newQty = existing.quantity - quantity;
			if (newQty > 0) {
				await ctx
					.update(table.playerShips)
					.set({ quantity: newQty })
					.where(eq(table.playerShips.id, existing.id));
			} else {
				await ctx.delete(table.playerShips).where(eq(table.playerShips.id, existing.id));
			}
			const now = Date.now();
			const eta = now + 60 * 1000; // 60s mission for demo
			await ctx
				.insert(table.missions)
				.values({
					id: crypto.randomUUID(),
					userId: user.id,
					shipTemplateId,
					quantity,
					startedAt: new Date(now),
					eta: new Date(eta),
					status: 'in_progress'
				});
		});
	} catch (err: any) {
		if (err.message === 'insufficient_ships') {
			return new Response(JSON.stringify({ error: 'insufficient_ships' }), { status: 400 });
		}
		console.error('Failed to start mission', err);
		return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500 });
	}

	return new Response(JSON.stringify({ started: true }), {
		headers: { 'content-type': 'application/json' }
	});
};
