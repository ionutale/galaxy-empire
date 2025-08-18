import type { RequestHandler } from './$types';
import { readJson, writeJson } from '$lib/server/demoStorage';

const PLAYER_FILE = 'player.json';

type PlayerState = {
  research?: Record<string, { startedAt?: number; level?: number }>;
  [k: string]: unknown;
};

const DEFAULT_STATE: PlayerState = {};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { techId } = await request.json();
    if (!techId) return new Response(JSON.stringify({ error: 'missing techId' }), { status: 400 });
  const state = await readJson<PlayerState>(PLAYER_FILE, DEFAULT_STATE);
  const research = state.research || {};
  const prev = research[techId] || {};
  // enqueue research: record startedAt and keep current level until finished by processor
  research[techId] = { startedAt: Date.now(), level: prev.level || 0 };
  const merged = { ...state, research };
  await writeJson<PlayerState>(PLAYER_FILE, merged);
    return new Response(JSON.stringify({ state: merged }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
  }
};
