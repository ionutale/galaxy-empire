import type { RequestHandler } from './$types';
import { readJson, writeJson } from '$lib/server/demoStorage';

const PLAYER_FILE = 'player.json';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { techId } = await request.json();
    if (!techId) return new Response(JSON.stringify({ error: 'missing techId' }), { status: 400 });
    const state = await readJson(PLAYER_FILE, {} as any);
    const research = state.research || {};
    research[techId] = { startedAt: Date.now(), level: (research[techId]?.level || 0) + 1 };
    const merged = { ...state, research };
    await writeJson(PLAYER_FILE, merged);
    return new Response(JSON.stringify({ state: merged }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
  }
};
