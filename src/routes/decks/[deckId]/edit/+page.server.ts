import { db } from '$lib/server/db';
import { playerDeck } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { loadPhrasesAndCombos, validateDeckPhraseIds, requireDeckOwner } from '$lib/server/db/queries';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const deck = await db.select().from(playerDeck).where(eq(playerDeck.id, params.deckId)).get();

	if (!deck) throw error(404, 'Deck not found');
	if (deck.userId !== locals.user.id) throw error(403, 'Not authorized');

	const { phrases, combos } = await loadPhrasesAndCombos();

	// Filter out orphaned phrase IDs (phrases that were deleted)
	const validPhraseIds = new Set(phrases.map((p) => p.id));
	deck.phraseIds = (deck.phraseIds as string[]).filter((id) => validPhraseIds.has(id));

	return { deck, phrases, combos };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		if (!await requireDeckOwner(params.deckId, locals.user.id)) {
			return fail(403, { error: 'Not authorized' });
		}

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		if (!name) return fail(400, { error: 'Deck name is required.' });

		const result = await validateDeckPhraseIds(data.get('phraseIds')?.toString());
		if (typeof result === 'string') return fail(400, { error: result });

		await db
			.update(playerDeck)
			.set({ name, phraseIds: result })
			.where(eq(playerDeck.id, params.deckId));

		return { success: true };
	},

	delete: async ({ params, locals }) => {
		if (!locals.user) throw redirect(303, '/login');
		if (!await requireDeckOwner(params.deckId, locals.user.id)) {
			return fail(403, { error: 'Not authorized' });
		}

		await db.delete(playerDeck).where(eq(playerDeck.id, params.deckId));
		throw redirect(303, '/decks');
	}
};
