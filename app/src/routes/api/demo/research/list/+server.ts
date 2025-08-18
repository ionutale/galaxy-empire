import type { RequestHandler } from './$types';
import { RESEARCH_DATA } from '$lib/data/gameData';

export const GET: RequestHandler = async () => {
  const techs = Object.entries(RESEARCH_DATA).map(([id, t]) => ({ id, name: t.name, description: t.description }));
  return new Response(JSON.stringify({ techs }), { headers: { 'Content-Type': 'application/json' } });
};
