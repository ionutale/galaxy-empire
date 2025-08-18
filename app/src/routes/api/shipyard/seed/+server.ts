import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { SHIP_TEMPLATES } from '$lib/data/gameData';

export const POST: RequestHandler = async () => {
  try {
    const existing = await db.select().from(table.shipTemplate).all();
    const existingIds = new Set(existing.map((r: any) => r.id));
    for (const s of SHIP_TEMPLATES) {
      if (existingIds.has(s.shipId)) continue;
      const row = { id: s.shipId, name: s.name, role: s.role, buildTime: s.buildTime, costCredits: s.buildCost?.credits || 0 } as any;
      await db.insert(table.shipTemplate).values(row).run();
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
