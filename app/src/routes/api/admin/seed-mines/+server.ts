import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, isNull } from 'drizzle-orm';

const NPC_ID = 'npc_faction';

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST() {
  // Ensure NPC user exists
  const npcUser = await db.select().from(table.user).where(eq(table.user.id, NPC_ID)).limit(1);
  if (npcUser.length === 0) {
    await db.insert(table.user).values({
      id: NPC_ID,
      username: 'Alien Faction',
      passwordHash: 'npc_secret'
    });
    await db.insert(table.playerState).values({
      userId: NPC_ID,
      credits: 1000000,
      metal: 1000000,
      crystal: 1000000,
      fuel: 1000000
    });
  }

  // Assign unowned planets to NPC
  await db.update(table.planets).set({ ownerId: NPC_ID }).where(isNull(table.planets.ownerId));

  // Fetch all planets owned by NPC
  const planets = await db.select().from(table.planets).where(eq(table.planets.ownerId, NPC_ID));

  // Fetch existing buildings to avoid duplicates
  const existingBuildings = await db.select().from(table.playerBuildings).where(eq(table.playerBuildings.userId, NPC_ID));
  const buildingMap = new Set(existingBuildings.map(b => b.buildingId)); // This is wrong, buildingId is type (e.g. metalMine). 
  // We need to check if a planet has buildings. But playerBuildings doesn't link to planet, it links to user.
  // Wait, the current schema `playerBuildings` does NOT link to a planet. It's global per user.
  // This means "mines on planets" is conceptually "mines owned by the planet owner".
  // Since all these planets are owned by NPC_ID, the NPC just has a huge pile of mines.
  // This works for the economy (NPC produces resources), but for "looting a specific planet", 
  // the loot comes from the user's global pool (NPC's pool).
  // So attacking ANY NPC planet steals from the same global NPC resource pool.
  // This is acceptable for now given the schema.

  // However, we don't want to add infinite mines if we run this multiple times.
  // Let's just add some mines if the NPC has very few.

  if (existingBuildings.length > 100) {
    return json({ message: 'NPC already has sufficient infrastructure.' });
  }

  const buildings: typeof table.playerBuildings.$inferInsert[] = [];

  for (const p of planets) {
    if (Math.random() > 0.3) {
      const metalLevel = randomInt(1, 10);
      const crystalLevel = randomInt(0, 8);
      const fuelLevel = randomInt(0, 5);

      if (metalLevel > 0) buildings.push({ id: crypto.randomUUID(), userId: NPC_ID, buildingId: 'metalMine', level: metalLevel });
      if (crystalLevel > 0) buildings.push({ id: crypto.randomUUID(), userId: NPC_ID, buildingId: 'crystalSynthesizer', level: crystalLevel });
      if (fuelLevel > 0) buildings.push({ id: crypto.randomUUID(), userId: NPC_ID, buildingId: 'deuteriumRefinery', level: fuelLevel });
    }
  }

  if (buildings.length > 0) {
    await db.insert(table.playerBuildings).values(buildings);
  }

  return json({ message: `Seeded ${buildings.length} mines for NPC.` });
}
