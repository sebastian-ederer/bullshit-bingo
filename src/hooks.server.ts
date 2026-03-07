import { redirect, type Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const publicPaths = ['/login', '/register', '/api/auth'];

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	event.locals._headers = event.request.headers;

	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	const isPublic = publicPaths.some((path) => event.url.pathname.startsWith(path));
	if (!isPublic && !event.locals.user) {
		throw redirect(303, '/login');
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
