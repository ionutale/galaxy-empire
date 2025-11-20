import { sequence } from '@sveltejs/kit/hooks';
import * as auth from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { startBuildProcessor } from '$lib/server/worker';
import { logger } from '$lib/logger';

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

const handleTheme: Handle = async ({ event, resolve }) => {
	const theme = event.cookies.get('theme');

	if (theme) {
		return await resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%sveltekit.theme%', `data-theme="${theme}"`)
		});
	}

	return await resolve(event);
};

export const handle: Handle = sequence(handleAuth, handleTheme);

// start background workers once when server boots (dev + prod)
// allow disabling in dev by setting DISABLE_BUILD_PROCESSOR=1
try {
	if (process.env.DISABLE_BUILD_PROCESSOR !== '1') {
		startBuildProcessor(5000);
	} else {
		logger.info('build processor disabled via DISABLE_BUILD_PROCESSOR=1');
	}
} catch (err) {
	logger.error({ err }, 'failed to start build processor');
}
