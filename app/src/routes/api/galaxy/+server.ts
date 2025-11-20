import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateGalaxy } from '$lib/server/galaxy/generator';

export async function GET() {
  // Ensure galaxy exists
  await generateGalaxy();

  const systems = await db.select().from(table.systems);
  const planets = await db.select().from(table.planets);

  // Group planets by system
  const systemsWithPlanets = systems.map(sys => ({
    ...sys,
    planets: planets.filter(p => p.systemId === sys.id)
  }));

  return json(systemsWithPlanets);
}
