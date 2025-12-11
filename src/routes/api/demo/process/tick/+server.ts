import type { RequestHandler } from '@sveltejs/kit';
import { processTick } from '$lib/server/processor';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({}));
	const seconds = typeof body.seconds === 'number' ? body.seconds : 5;
	const res = await processTick(seconds);
	return new Response(JSON.stringify(res), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
};

export const GET: RequestHandler = async () => {
	const res = await processTick(5);
	return new Response(JSON.stringify(res), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
};
