import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const username = (form.get('username') as string)?.trim();
		const password = (form.get('password') as string)?.trim();

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required.' });
		}

		try {
			await auth.api.signInUsername({
				body: { username, password }
			});
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : '';
			if (msg.includes('REDIRECT') || msg.includes('Redirect')) throw e;
			return fail(400, { error: 'Invalid username or password.' });
		}

		throw redirect(303, '/');
	}
};
