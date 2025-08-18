import type { RequestHandler } from './$types';
import { readJson, writeJson } from '$lib/server/demoStorage';

const PLAYER_FILE = 'player.json';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { buildingId } = await request.json();
    if (!buildingId) return new Response(JSON.stringify({ error: 'missing buildingId' }), { status: 400 });
    const state = await readJson(PLAYER_FILE, {} as any);
    const buildings = state.buildings || {};
    buildings[buildingId] = (buildings[buildingId] || 0) + 1;
    const merged = { ...state, buildings };
    await writeJson(PLAYER_FILE, merged);
    return new Response(JSON.stringify({ state: merged }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
  }
};
