import type { RequestHandler } from '@sveltejs/kit';
import { getMetrics } from '$lib/server/metrics';

export const GET: RequestHandler = async () => {
  return new Response(JSON.stringify({ metrics: getMetrics() }), { headers: { 'content-type': 'application/json' } });
};
