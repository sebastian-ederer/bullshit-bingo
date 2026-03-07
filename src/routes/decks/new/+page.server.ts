import { db } from '$lib/server/db';
import { playerDeck } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { loadPhrasesAndCombos, validateDeckPhraseIds } from '$lib/server/db/queries';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	return loadPhrasesAndCombos();
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		if (!name) return fail(400, { error: 'Deck name is required.' });

		const result = await validateDeckPhraseIds(data.get('phraseIds')?.toString());
		if (typeof result === 'string') return fail(400, { error: result });

		await db.insert(playerDeck).values({
			userId: locals.user.id,
			name,
			phraseIds: result
		});

		throw redirect(303, '/decks');
	}
};
