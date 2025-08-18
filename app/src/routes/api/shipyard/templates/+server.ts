import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { SHIP_TEMPLATES } from '$lib/data/gameData';

export const GET: RequestHandler = async () => {
  let templates = await db.select().from(table.shipTemplate).all();
  if (templates.length === 0) {
    // seed a few simple templates
    const now = new Date();
    // seed from canonical SHIP_TEMPLATES
    for (const s of SHIP_TEMPLATES) {
      const row = {
        id: s.shipId,
        name: s.name,
        role: s.role,
        buildTime: s.buildTime,
        costCredits: s.buildCost?.credits || 0
      } as any;
      await db.insert(table.shipTemplate).values(row).run();
    }
    templates = await db.select().from(table.shipTemplate).all();
  }
  return new Response(JSON.stringify({ templates }), { headers: { 'content-type': 'application/json' } });
};
