import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc, or } from 'drizzle-orm';

export async function GET({ locals }) {
  const user = locals.user;
  if (!user) return json([], { status: 401 });

  const reports = await db
    .select()
    .from(table.combatReports)
    .where(or(eq(table.combatReports.attackerId, user.id), eq(table.combatReports.defenderId, user.id)))
    .orderBy(desc(table.combatReports.timestamp))
    .limit(20);

  return json(reports);
}
