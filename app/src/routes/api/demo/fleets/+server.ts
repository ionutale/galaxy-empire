import type { RequestHandler } from './$types';
import { readJson } from '$lib/server/demoStorage';

const FLEETS_FILE = 'fleets.json';

export const GET: RequestHandler = async () => {
  const fleets = await readJson(FLEETS_FILE, [] as unknown[]);
  return new Response(JSON.stringify({ fleets }), { headers: { 'Content-Type': 'application/json' } });
};
