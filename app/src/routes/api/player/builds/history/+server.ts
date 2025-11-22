import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET({ locals, url }) {
  const user = locals.user;
  if (!user) return json([], { status: 401 });

  const page = Number(url.searchParams.get('page')) || 1;
  const limit = Number(url.searchParams.get('limit')) || 10;
  const offset = (page - 1) * limit;

  const history = await db
    .select()
    .from(table.processedBuilds)
    .where(eq(table.processedBuilds.userId, user.id))
    .orderBy(desc(table.processedBuilds.processedAt))
    .limit(limit)
    .offset(offset);

  return json(history);
}
