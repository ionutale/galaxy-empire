import type { RequestHandler } from './$types';
import { readJson, writeJson } from '$lib/server/demoStorage';

const PLAYER_FILE = 'player.json';
const BUILDS_FILE = 'builds.json';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { buildingId } = await request.json();
    if (!buildingId) return new Response(JSON.stringify({ error: 'missing buildingId' }), { status: 400 });
    // enqueue building upgrade as a build
    const builds = await readJson(BUILDS_FILE, [] as any[]);
    const now = new Date().toISOString();
    const duration = 10; // default duration seconds for demo; could use BUILDING_DATA time func
    const entry = { id: `build-${Date.now()}`, type: 'building', buildingId, createdAt: now, durationSeconds: duration, status: 'queued' };
    builds.push(entry);
    await writeJson(BUILDS_FILE, builds);

    const state = await readJson(PLAYER_FILE, {} as any);
    return new Response(JSON.stringify({ state, queued: entry }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
  }
};
