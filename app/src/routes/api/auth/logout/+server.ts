import type { RequestHandler } from '@sveltejs/kit';
import {
	deleteSessionTokenCookie,
	validateSessionToken,
	invalidateSession,
	sessionCookieName
} from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
	const token = event.cookies.get(sessionCookieName);
	if (token) {
		const { session } = await validateSessionToken(token);
		if (session) {
			await invalidateSession(session.id);
		}
		deleteSessionTokenCookie(event);
	}
	return new Response(null, { status: 204 });
};
