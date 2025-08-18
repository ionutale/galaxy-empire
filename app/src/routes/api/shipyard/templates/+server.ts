import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
  let templates = await db.select().from(table.shipTemplate).all();
  if (templates.length === 0) {
    // seed a few simple templates
    const now = new Date();
    const samples = [
      { id: 'scout', name: 'Scout', role: 'scout', buildTime: 10, costCredits: 50 },
      { id: 'fighter', name: 'Fighter', role: 'fighter', buildTime: 30, costCredits: 150 },
      { id: 'cruiser', name: 'Cruiser', role: 'cruiser', buildTime: 90, costCredits: 500 }
    ];
    for (const s of samples) {
      await db.insert(table.shipTemplate).values(s).run();
    }
    templates = await db.select().from(table.shipTemplate).all();
  }
  return new Response(JSON.stringify({ templates }), { headers: { 'content-type': 'application/json' } });
};
