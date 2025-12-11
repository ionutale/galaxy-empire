import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const fleets = await db
		.select()
		.from(table.fleets)
		.where(eq(table.fleets.userId, locals.user.id));
	return json(fleets);
}
