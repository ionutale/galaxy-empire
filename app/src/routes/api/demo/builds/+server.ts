import type { RequestHandler } from './$types';
import { readJson, writeJson } from '$lib/server/demoStorage';

const BUILDS_FILE = 'builds.json';

interface BuildEntry {
  id: string;
  type?: string;
  createdAt: string;
  status: string;
  [k: string]: unknown;
}

export const GET: RequestHandler = async () => {
  const builds = await readJson<BuildEntry[]>(BUILDS_FILE, []);
  return new Response(JSON.stringify({ builds }), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
  const builds = await readJson<BuildEntry[]>(BUILDS_FILE, []);
    const id = 'b_' + Date.now();
    const entry = { id, ...body, createdAt: new Date().toISOString(), status: 'queued' };
    builds.push(entry);
    await writeJson(BUILDS_FILE, builds);
    return new Response(JSON.stringify({ build: entry }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
  }
};
