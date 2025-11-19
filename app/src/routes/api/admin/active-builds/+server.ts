import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';



function isAdmin(event: Request) {
  const key = event.headers.get('x-admin-key') || '';
  return env.ADMIN_KEY && key === env.ADMIN_KEY;
}

export const GET: RequestHandler = async ({ request }) => {
  if (!isAdmin(request)) return new Response(null, { status: 403 });

  // Fetch active builds from DB (status not 'complete')
  const builds = await db.select().from(table.buildQueue).where(eq(table.buildQueue.userId, request.headers.get('x-user-id') ?? '')).execute();
  const active = builds;

  return new Response(JSON.stringify({ items: active }), { headers: { 'content-type': 'application/json' } });
};
