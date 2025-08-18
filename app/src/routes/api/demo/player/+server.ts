import type { RequestHandler } from './$types';
import { readJson, writeJson } from '$lib/server/demoStorage';

const PLAYER_FILE = 'player.json';
const defaultState = {
  playerId: 'demo_player',
  displayName: 'DemoPilot',
  level: 9,
  power: 9823,
  resources: {
    credits: 1318,
    metal: 8650,
    crystal: 4300000,
    fuel: 1368
  },
  vipLevel: 1,
  allianceId: null,
  ships: { scout: 24, fighter: 12 }
};

export const GET: RequestHandler = async () => {
  const state = await readJson(PLAYER_FILE, defaultState);
  return new Response(JSON.stringify({ state }), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const current = await readJson(PLAYER_FILE, defaultState);
    const merged = { ...current, ...body };
    if (body.resources) merged.resources = { ...current.resources, ...body.resources };
    await writeJson(PLAYER_FILE, merged);
    return new Response(JSON.stringify({ state: merged }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
  }
};
