import type { RequestHandler } from './$types';
import { readJson, writeJson } from '$lib/server/demoStorage';

const PLAYER_FILE = 'player.json';

type PlayerState = {
  chips?: Record<string, number>;
  equippedChips?: Record<string, boolean>;
  buildings?: Record<string, number>;
  research?: Record<string, unknown>;
  resources?: Record<string, number>;
  [k: string]: unknown;
};

const DEFAULT_STATE: PlayerState = {};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { buildingId } = await request.json();
    if (!buildingId) return new Response(JSON.stringify({ error: 'missing buildingId' }), { status: 400 });
    const state = await readJson<PlayerState>(PLAYER_FILE, DEFAULT_STATE);
    const buildings = state.buildings || {};
    buildings[buildingId] = (buildings[buildingId] || 0) + 1;
    const merged = { ...state, buildings };
    await writeJson<PlayerState>(PLAYER_FILE, merged);
    return new Response(JSON.stringify({ state: merged }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
  }
};
