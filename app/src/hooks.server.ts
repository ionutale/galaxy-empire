import { sequence } from '@sveltejs/kit/hooks';
import * as auth from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { startBuildProcessor } from '$lib/server/worker';

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

export const handle: Handle = sequence(handleAuth);

// start background workers once when server boots (dev + prod)
// allow disabling in dev by setting DISABLE_BUILD_PROCESSOR=1
try {
	if (process.env.DISABLE_BUILD_PROCESSOR !== '1') {
		startBuildProcessor(5000);
	} else {
		console.log('build processor disabled via DISABLE_BUILD_PROCESSOR=1');
	}
} catch (err) {
	console.error('failed to start build processor', err);
}
