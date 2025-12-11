import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, or } from 'drizzle-orm';

export async function GET({ params, locals }) {
  const user = locals.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  // Try combat reports
  let report = await db
    .select()
    .from(table.combatReports)
    .where(and(
      eq(table.combatReports.id, params.id),
      or(eq(table.combatReports.attackerId, user.id), eq(table.combatReports.defenderId, user.id))
    ))
    .limit(1);

  if (report.length) {
    return json({ ...report[0], type: 'combat' });
  }

  // Try espionage reports
  const spyReport = await db
    .select()
    .from(table.espionageReports)
    .where(and(
      eq(table.espionageReports.id, params.id),
      or(eq(table.espionageReports.userId, user.id), eq(table.espionageReports.targetId, user.id))
    ))
    .limit(1);

  if (spyReport.length) {
    return json({ ...spyReport[0], type: 'espionage' });
  }

  return json({ error: 'Not found' }, { status: 404 });
}
