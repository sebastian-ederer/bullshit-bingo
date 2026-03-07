import { db } from '$lib/server/db';
import { gameSession } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { generateGameCode } from '$lib/server/db/queries';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const form = await request.formData();
		const name = form.get('name')?.toString().trim();

		if (!name) return fail(400, { error: 'Game name is required.' });

		const code = generateGameCode();

		const [game] = await db
			.insert(gameSession)
			.values({
				code,
				name,
				createdBy: locals.user.id
			})
			.returning();

		throw redirect(303, `/admin/games/${game.id}`);
	}
};
