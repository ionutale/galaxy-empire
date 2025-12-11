import type { RequestHandler } from '@sveltejs/kit';
import { getMetrics } from '$lib/server/metrics';
import { getState as getBreakerState } from '$lib/server/circuitBreaker';

export const GET: RequestHandler = async () => {
	return new Response(JSON.stringify({ metrics: getMetrics(), breaker: getBreakerState() }), {
		headers: { 'content-type': 'application/json' }
	});
};
