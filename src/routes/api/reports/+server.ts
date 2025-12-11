import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc, or } from 'drizzle-orm';

export async function GET({ locals, url }) {
  const user = locals.user;
  if (!user) return json([], { status: 401 });

  const page = Number(url.searchParams.get('page')) || 1;
  const limit = Number(url.searchParams.get('limit')) || 20;
  const offset = (page - 1) * limit;

  // Fetch combat reports
  const combat = await db
    .select()
    .from(table.combatReports)
    .where(or(eq(table.combatReports.attackerId, user.id), eq(table.combatReports.defenderId, user.id)))
    .orderBy(desc(table.combatReports.timestamp))
    .limit(limit + offset); // Fetch more to handle client-side merge/sort if needed, or just fetch enough

  // Fetch espionage reports
  const espionage = await db
    .select()
    .from(table.espionageReports)
    .where(or(eq(table.espionageReports.userId, user.id), eq(table.espionageReports.targetId, user.id)))
    .orderBy(desc(table.espionageReports.timestamp))
    .limit(limit + offset);

  // Combine and sort
  const combined = [
    ...combat.map(r => ({ ...r, type: 'combat' })),
    ...espionage.map(r => ({ ...r, type: 'espionage' }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Paginate
  const paginated = combined.slice(offset, offset + limit);

  return json(paginated);
}
