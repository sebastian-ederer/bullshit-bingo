import { deleteUserAndData } from '$lib/server/db/queries';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}
};

export const actions: Actions = {
	delete: async ({ locals, cookies }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		await deleteUserAndData(locals.user.id);

		// Clear session cookie so the auth handler doesn't try to look up the deleted session
		cookies.delete('better-auth.session_token', { path: '/' });

		throw redirect(303, '/login');
	}
};
