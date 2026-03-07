import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const data = await request.formData();
		const currentPassword = data.get('currentPassword')?.toString()?.trim();
		const newPassword = data.get('newPassword')?.toString()?.trim();

		if (!currentPassword) {
			return fail(400, { error: 'Current password is required.' });
		}
		if (!newPassword || newPassword.length < 6) {
			return fail(400, { error: 'New password must be at least 6 characters.' });
		}

		try {
			await auth.api.changePassword({
				headers: locals._headers,
				body: { currentPassword, newPassword }
			});
		} catch {
			return fail(400, { error: 'Current password is incorrect.' });
		}

		return { success: true, message: 'Password updated.' };
	}
};
