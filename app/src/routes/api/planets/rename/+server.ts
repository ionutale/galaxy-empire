import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  const { planetId, name } = body;

  if (!planetId || !name || typeof name !== 'string' || name.length > 30) {
    return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
  }

  try {
    // Verify ownership
    const planet = await db
      .select()
      .from(table.planets)
      .where(and(eq(table.planets.id, planetId), eq(table.planets.ownerId, session.user.id)))
      .limit(1);

    if (planet.length === 0) {
      return new Response(JSON.stringify({ error: 'Planet not found or not owned' }), { status: 404 });
    }

    await db
      .update(table.planets)
      .set({ name: name.trim() })
      .where(eq(table.planets.id, planetId));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    console.error('Rename error', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
};
