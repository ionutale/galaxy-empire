import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

export async function GET({ locals }) {
  const user = locals.user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const reportId = crypto.randomUUID();
  await db.insert(table.combatReports).values({
    id: reportId,
    attackerId: user.id,
    defenderId: 'NPC',
    timestamp: new Date(),
    outcome: 'attacker_win',
    log: [{ message: 'Test combat log entry' }],
    loot: { metal: 100, crystal: 50, fuel: 10 }
  });

  return json({ success: true, reportId });
}
