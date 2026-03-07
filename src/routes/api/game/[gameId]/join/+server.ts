import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { gamePlayer, playerDeck } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { broadcast } from '$lib/server/sse';
import { getValidPhraseIdSet, findPlayerInGame, findGameStatus } from '$lib/server/db/queries';
import { displayName } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals, request }) => {
	if (!locals.user) throw error(401, 'Not authenticated');

	const game = await findGameStatus(params.gameId);
	if (!game) throw error(404, 'Game not found');
	if (game.status === 'finished') throw error(400, 'Game has ended');

	const existing = await findPlayerInGame(params.gameId, locals.user.id);

	if (existing) {
		return json({ playerId: existing.id, alreadyJoined: true });
	}

	let deckId: string | null = null;
	let card: string[] | null = null;
	try {
		const body = await request.json();
		deckId = body.deckId ?? null;
	} catch {
		// No body or invalid JSON
	}

	if (deckId) {
		const deck = await db
			.select({ userId: playerDeck.userId, phraseIds: playerDeck.phraseIds })
			.from(playerDeck)
			.where(eq(playerDeck.id, deckId))
			.get();

		if (!deck) throw error(400, 'Deck not found');
		if (deck.userId !== locals.user.id) throw error(403, 'Deck does not belong to you');

		const phraseIds = deck.phraseIds as string[];
		const validIds = await getValidPhraseIdSet();
		const validCount = phraseIds.filter((id) => validIds.has(id)).length;
		if (validCount !== 9) {
			throw error(400, 'Deck has invalid/deleted phrases. Please edit your deck first.');
		}

		card = phraseIds;
	}

	const [player] = await db
		.insert(gamePlayer)
		.values({
			gameId: params.gameId,
			userId: locals.user.id,
			deckId,
			card,
			marks: [],
			scoredPatterns: [],
			score: 0
		})
		.returning();

	broadcast(params.gameId, 'player_joined', {
		username: displayName(locals.user)
	});

	return json({ playerId: player.id, alreadyJoined: false });
};
