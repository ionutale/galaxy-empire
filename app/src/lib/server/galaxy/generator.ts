import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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

  await db.insert(table.systems).values(systems);
  await db.insert(table.planets).values(planets);

  console.log('Galaxy generation complete.');
}
