import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, isNull } from 'drizzle-orm';

const SYSTEM_NAMES = [
  'Sol', 'Alpha Centauri', 'Sirius', 'Vega', 'Betelgeuse', 'Rigel', 'Procyon', 'Altair', 'Antares', 'Spica',
  'Pollux', 'Deneb', 'Regulus', 'Fomalhaut', 'Aldebaran', 'Arcturus', 'Capella', 'Canopus', 'Achernar', 'Hadar',
  'Acrux', 'Mimosa', 'Shaula', 'Castor', 'Gacrux', 'Bellatrix', 'Elnath', 'Miaplacidus', 'Alnair', 'Alnilam',
  'Alnitak', 'Alioth', 'Dubhe', 'Mirfak', 'Wezen', 'Sargas', 'Kaus Australis', 'Avior', 'Alkaid', 'Menkalinan'
];

const PLANET_TYPES = ['terrestrial', 'gas_giant', 'ice', 'lava', 'ocean', 'desert', 'barren'];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const NPC_ID = 'npc_faction';

export async function generateGalaxy(width = 100, height = 100, systemCount = 50) {
  // Check if galaxy already exists
  const existing = await db.select().from(table.systems).limit(1);
  if (existing.length > 0) {
    console.log('Galaxy already exists, skipping generation.');
    return;
  }

  console.log(`Generating galaxy with ${systemCount} systems...`);

  const systems: typeof table.systems.$inferInsert[] = [];
  const planets: typeof table.planets.$inferInsert[] = [];

  for (let i = 0; i < systemCount; i++) {
    const id = i + 1;
    const name = SYSTEM_NAMES[i] || `System-${id}`;
    const x = randomInt(-width / 2, width / 2);
    const y = randomInt(-height / 2, height / 2);

    systems.push({ id, x, y, name });

    // Generate planets for this system
    const planetCount = randomInt(1, 8);
    for (let j = 0; j < planetCount; j++) {
      const type = randomChoice(PLANET_TYPES);
      const planetId = `p-${id}-${j + 1}`;

      // Resource modifiers based on type
      let resources = { metal: 1, crystal: 1, fuel: 1 };
      if (type === 'lava') resources = { metal: 2, crystal: 0.5, fuel: 1 };
      if (type === 'ice') resources = { metal: 0.5, crystal: 2, fuel: 1.5 };
      if (type === 'gas_giant') resources = { metal: 0.2, crystal: 0.5, fuel: 3 };
      if (type === 'terrestrial') resources = { metal: 1.2, crystal: 1.2, fuel: 1 };
      if (type === 'ocean') resources = { metal: 0.8, crystal: 1.5, fuel: 2 };

      planets.push({
        id: planetId,
        systemId: id,
        orbitIndex: j + 1,
        name: `${name} ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][j]}`,
        type,
        resources
      });
    }
  }

  // Create NPC user if not exists
  const npcUser = await db.select().from(table.user).where(eq(table.user.id, NPC_ID)).limit(1);
  if (npcUser.length === 0) {
    await db.insert(table.user).values({
      id: NPC_ID,
      username: 'Alien Faction',
      passwordHash: 'npc_secret' // Not used
    });
    // Initialize NPC state
    await db.insert(table.playerState).values({
      userId: NPC_ID,
      credits: 1000000,
      metal: 1000000,
      crystal: 1000000,
      fuel: 1000000
    });
  }

  await db.insert(table.systems).values(systems);
  await db.insert(table.planets).values(planets);

  // Generate random mines for planets (assign to NPC)
  // We need to update planets to be owned by NPC first? Or just assume unowned planets are wild?
  // The prompt says "planets have random level of mines".
  // Let's assign all generated planets to NPC_ID so they can be attacked and looted properly.
  // Update the planets array before insert.

  // Wait, I already inserted planets. Let's update the planets array construction above instead.
  // But I can't easily edit the loop above in this chunk without replacing the whole file.
  // I will do a separate update after insert or modify the loop if I can target it.
  // Actually, I can just modify the planets push in the loop if I target it.
  // But I am targeting the end of the file here.

  // Let's just update the planets table to set ownerId = NPC_ID for all new planets.
  // And then insert buildings.

  await db.update(table.planets).set({ ownerId: NPC_ID }).where(isNull(table.planets.ownerId));

  const buildings: typeof table.playerBuildings.$inferInsert[] = [];

  // Fetch all planets to assign buildings (in case we run this on existing galaxy, though we return early if existing)
  // Since we just inserted, we can use the `planets` array if we had IDs, but we generated IDs.
  // Let's just iterate the `planets` array we created.

  for (const p of planets) {
    // Random mines
    if (Math.random() > 0.3) { // 70% chance of mines
      const metalLevel = randomInt(1, 10);
      const crystalLevel = randomInt(0, 8);
      const fuelLevel = randomInt(0, 5);

      if (metalLevel > 0) {
        buildings.push({ id: crypto.randomUUID(), userId: NPC_ID, buildingId: 'metalMine', level: metalLevel });
      }
      if (crystalLevel > 0) {
        buildings.push({ id: crypto.randomUUID(), userId: NPC_ID, buildingId: 'crystalSynthesizer', level: crystalLevel });
      }
      if (fuelLevel > 0) {
        buildings.push({ id: crypto.randomUUID(), userId: NPC_ID, buildingId: 'deuteriumRefinery', level: fuelLevel });
      }
    }
  }

  if (buildings.length > 0) {
    // Chunk inserts to avoid limits if necessary, but 50 systems * 8 planets * 3 buildings ~ 1200 rows is fine.
    await db.insert(table.playerBuildings).values(buildings);
  }

  console.log('Galaxy generation complete.');
}
