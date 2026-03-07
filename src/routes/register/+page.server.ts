import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/');
};

const USERNAME_REGEX = /^[a-zA-Z0-9_.\-]+$/;

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const username = (form.get('username') as string)?.trim();
		const password = (form.get('password') as string)?.trim();

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required.' });
		}

		if (username.length < 3) {
			return fail(400, { error: 'Username must be at least 3 characters.' });
		}

		if (username.length > 20) {
			return fail(400, { error: 'Username must be at most 20 characters.' });
		}

		if (!USERNAME_REGEX.test(username)) {
			return fail(400, {
				error: 'Username may only contain letters, numbers, "_", "-", and ".".'
			});
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters.' });
		}

		try {
			await auth.api.signUpEmail({
				body: {
					username,
					email: `${username.toLowerCase()}@bingo.local`,
					password,
					name: username
				}
			});
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : '';
			if (msg.includes('REDIRECT') || msg.includes('Redirect')) throw e;
			if (msg.includes('UNIQUE') || msg.includes('unique') || msg.includes('already')) {
				return fail(400, { error: 'Username already taken.' });
			}
			return fail(400, { error: 'Registration failed. Please try again.' });
		}

		throw redirect(303, '/login');
	}
};
