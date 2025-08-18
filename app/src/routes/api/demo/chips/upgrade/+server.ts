import type { RequestHandler } from './$types';
import { readJson, writeJson } from '$lib/server/demoStorage';

const PLAYER_FILE = 'player.json';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { chipId } = await request.json();
    if (!chipId) return new Response(JSON.stringify({ error: 'missing chipId' }), { status: 400 });
    const state = await readJson(PLAYER_FILE, {} as any);
    const chips = state.chips || {};
    chips[chipId] = (chips[chipId] || 0) + 1;
    const merged = { ...state, chips };
    await writeJson(PLAYER_FILE, merged);
    return new Response(JSON.stringify({ state: merged }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
  }
};
