import type { RequestHandler } from '@sveltejs/kit';
import { processTick } from '$lib/server/processor';
import { env } from '$env/dynamic/private';

function isAdmin(event: Request) {
	const key = event.headers.get('x-admin-key') || '';
	return env.ADMIN_KEY && key === env.ADMIN_KEY;
}

export const POST: RequestHandler = async ({ request }) => {
	if (!isAdmin(request)) return new Response(null, { status: 403 });

	try {
		const result = await processTick(5); // Force a 5s tick
		return new Response(JSON.stringify({ success: true, result }), {
			headers: { 'content-type': 'application/json' }
		});
	} catch (e) {
		return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
	}
};
