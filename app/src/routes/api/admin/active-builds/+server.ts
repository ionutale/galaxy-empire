import type { RequestHandler } from '@sveltejs/kit';
import { readJson } from '$lib/server/demoStorage';
import { env } from '$env/dynamic/private';

const BUILDS_FILE = 'builds.json';

function isAdmin(event: Request) {
  const key = event.headers.get('x-admin-key') || '';
  return env.ADMIN_KEY && key === env.ADMIN_KEY;
}

export const GET: RequestHandler = async ({ request }) => {
  if (!isAdmin(request)) return new Response(null, { status: 403 });
  
  const builds = await readJson(BUILDS_FILE, []);
  // Filter for active builds (status != 'complete')
  const active = builds.filter((b: any) => b.status !== 'complete');
  
  return new Response(JSON.stringify({ items: active }), { headers: { 'content-type': 'application/json' } });
};
