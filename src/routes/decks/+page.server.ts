import { db } from '$lib/server/db';
import { playerDeck } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { getValidPhraseIdSet, requireDeckOwner } from '$lib/server/db/queries';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const decks = await db
		.select({
			id: playerDeck.id,
			name: playerDeck.name,
			phraseIds: playerDeck.phraseIds,
			createdAt: playerDeck.createdAt
		})
		.from(playerDeck)
		.where(eq(playerDeck.userId, locals.user.id))
		.orderBy(playerDeck.createdAt);

	const validIds = await getValidPhraseIdSet();

	const decksWithValidity = decks.map((deck) => {
		const phraseIds = deck.phraseIds as string[];
		const validPhraseCount = phraseIds.filter((id) => validIds.has(id)).length;
		return { ...deck, validPhraseCount };
	});

	return { decks: decksWithValidity };
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const data = await request.formData();
		const deckId = data.get('deckId')?.toString();
		if (!deckId) return fail(400, { error: 'Deck ID is required' });

		if (!await requireDeckOwner(deckId, locals.user.id)) {
			return fail(403, { error: 'Not authorized' });
		}

		await db.delete(playerDeck).where(eq(playerDeck.id, deckId));
		return { success: true };
	}
};
