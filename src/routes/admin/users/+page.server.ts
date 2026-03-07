import { auth } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import { deleteUserAndData } from '$lib/server/db/queries';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const result = await auth.api.listUsers({
		headers: locals._headers,
		query: { limit: 500 }
	});

	const users = result.users.map((u) => {
		const user = u as unknown as Record<string, unknown>;
		return {
			id: u.id,
			username: (user.username as string) ?? u.name,
			role: u.role ?? 'user',
			createdAt: u.createdAt
		};
	});

	return { users };
};

export const actions: Actions = {
	setPassword: async ({ request, locals }) => {
		const data = await request.formData();
		const userId = data.get('userId')?.toString();
		const newPassword = data.get('newPassword')?.toString()?.trim();

		if (!userId) return fail(400, { error: 'User ID is required.' });
		if (!newPassword || newPassword.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters.' });
		}

		try {
			await auth.api.setUserPassword({
				headers: locals._headers,
				body: { userId, newPassword }
			});
		} catch {
			return fail(500, { error: 'Failed to set password.' });
		}

		return { success: true, message: 'Password updated.' };
	},

	deleteUser: async ({ request, locals }) => {
		const data = await request.formData();
		const userId = data.get('userId')?.toString();

		if (!userId) return fail(400, { error: 'User ID is required.' });
		if (userId === locals.user?.id) {
			return fail(400, { error: 'You cannot delete your own account from here.' });
		}

		try {
			await deleteUserAndData(userId);
		} catch {
			return fail(500, { error: 'Failed to delete user.' });
		}

		return { success: true, message: 'User deleted.' };
	}
};
