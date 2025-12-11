import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

async function checkTables() {
  try {
    const res = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('systems', 'planets');
    `);
    console.log('Existing tables:', res.rows.map(r => r.table_name));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

checkTables();
