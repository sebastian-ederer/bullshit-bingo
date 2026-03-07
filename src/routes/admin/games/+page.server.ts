import { db } from '$lib/server/db';
import { chatMessage, gamePlayer, gameResult, gameSession } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { loadGamesList } from '$lib/server/db/queries';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return loadGamesList();
};

export const actions: Actions = {
	reset: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { error: 'Not authorized' });
		}

		const data = await request.formData();
		const confirmation = data.get('confirmation')?.toString();

		if (confirmation !== 'RESET') {
			return fail(400, { error: 'Type RESET to confirm.' });
		}

		db.transaction((tx) => {
			tx.delete(chatMessage).run();
			tx.delete(gamePlayer).run();
			tx.delete(gameResult).run();
			tx.delete(gameSession).run();
		});

		return { resetSuccess: true };
	}
};
