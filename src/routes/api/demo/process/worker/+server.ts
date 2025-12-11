import type { RequestHandler } from './$types';
import { processTick } from '$lib/server/processor';

let intervalId: number | null = null;

function startInterval(fn: () => void, ms: number): number {
	const id = setInterval(fn, ms);
	return Number(id as unknown as number);
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({}) as unknown);
	const action =
		typeof (body as { action?: unknown }).action === 'string'
			? (body as { action: string }).action
			: 'status';
	if (action === 'start') {
		const secs = typeof body.seconds === 'number' ? body.seconds : 5;
		if (!intervalId) {
			// use globalThis.setInterval to get a numeric id in this runtime
			intervalId = startInterval(() => {
				processTick(secs).catch(() => {});
			}, secs * 1000);
			return new Response(JSON.stringify({ status: 'started', seconds: secs }), {
				headers: { 'Content-Type': 'application/json' }
			});
		}
		return new Response(JSON.stringify({ status: 'already_running' }), {
			headers: { 'Content-Type': 'application/json' }
		});
	}

	if (action === 'stop') {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
			return new Response(JSON.stringify({ status: 'stopped' }), {
				headers: { 'Content-Type': 'application/json' }
			});
		}
		return new Response(JSON.stringify({ status: 'not_running' }), {
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return new Response(JSON.stringify({ status: intervalId ? 'running' : 'stopped' }), {
		headers: { 'Content-Type': 'application/json' }
	});
};
