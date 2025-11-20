import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, or } from 'drizzle-orm';

export async function GET({ params, locals }) {
  const user = locals.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const report = await db
    .select()
    .from(table.combatReports)
    .where(and(
      eq(table.combatReports.id, params.id),
      or(eq(table.combatReports.attackerId, user.id), eq(table.combatReports.defenderId, user.id))
    ))
    .limit(1);

  if (!report.length) return json({ error: 'Not found' }, { status: 404 });

  return json(report[0]);
}
