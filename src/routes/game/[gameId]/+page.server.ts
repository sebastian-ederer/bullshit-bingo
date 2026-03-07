import { db } from '$lib/server/db';
import {
	gameSession,
	gamePlayer,
	topicPhrase,
	user,
	chatMessage,
	playerDeck
} from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { getValidPhraseIdSet, getGamePlayers, requireGameOwnerOrAdmin, findPlayerInGame } from '$lib/server/db/queries';
import { startGame, endGame } from '$lib/server/game/actions';
import { displayName } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const game = await db
		.select({
			id: gameSession.id,
			code: gameSession.code,
			name: gameSession.name,
			status: gameSession.status,
			createdBy: gameSession.createdBy
		})
		.from(gameSession)
		.where(eq(gameSession.id, params.gameId))
		.get();

	if (!game) throw error(404, 'Game not found');

	const player = await findPlayerInGame(params.gameId, locals.user.id);

	// Resolve card phrase data
	let cardPhrases: { id: string; title: string; subtitle: string | null; basePoints: number }[] =
		[];
	if (player?.card) {
		const phraseIds = player.card as string[];
		if (phraseIds.length > 0) {
			const phrases = await db
				.select({
					id: topicPhrase.id,
					title: topicPhrase.title,
					subtitle: topicPhrase.subtitle,
					basePoints: topicPhrase.basePoints
				})
				.from(topicPhrase)
				.where(inArray(topicPhrase.id, phraseIds));

			const phraseMap = new Map(phrases.map((p) => [p.id, p]));
			cardPhrases = phraseIds.map(
				(id) => phraseMap.get(id) ?? { id, title: '???', subtitle: null, basePoints: 0 }
			);
		}
	}

	// Get all players for lobby / scoreboard
	const players = await getGamePlayers(params.gameId);

	// Get recent chat messages
	const messages = await db
		.select({
			id: chatMessage.id,
			userId: chatMessage.userId,
			username: user.username,
			name: user.name,
			message: chatMessage.message,
			createdAt: chatMessage.createdAt
		})
		.from(chatMessage)
		.leftJoin(user, eq(user.id, chatMessage.userId))
		.where(eq(chatMessage.gameId, params.gameId))
		.orderBy(chatMessage.createdAt)
		.limit(100);

	// Load all user's decks with valid phrase counts
	const rawDecks = await db
		.select({ id: playerDeck.id, name: playerDeck.name, phraseIds: playerDeck.phraseIds })
		.from(playerDeck)
		.where(eq(playerDeck.userId, locals.user.id));

	const validPhraseIdSet = await getValidPhraseIdSet();

	const userDecks = rawDecks.map((d) => {
		const ids = d.phraseIds as string[];
		return { id: d.id, name: d.name, validPhraseCount: ids.filter((id) => validPhraseIdSet.has(id)).length };
	});

	const isOwner = game.createdBy === locals.user.id;
	const isAdmin = locals.user.role === 'admin';

	// Fetch owner username for display in lobby (skip query if current user is owner)
	const owner = isOwner
		? locals.user
		: await db
				.select({ username: user.username, name: user.name })
				.from(user)
				.where(eq(user.id, game.createdBy))
				.get();

	return {
		game: {
			id: game.id,
			code: game.code,
			name: game.name,
			status: game.status
		},
		isOwner,
		isAdmin,
		ownerUsername: displayName(owner, 'Host'),
		player: player
			? {
					id: player.id,
					marks: player.marks as number[],
					score: player.score,
					scoredPatterns: player.scoredPatterns as string[]
				}
			: null,
		cardPhrases,
		players: players.map((p) => ({
			username: displayName(p),
			score: p.score,
			isMe: p.userId === locals.user!.id
		})),
		messages: messages.map((m) => ({
			id: m.id,
			userId: m.userId,
			username: m.userId === 'system' ? 'System' : displayName(m),
			message: m.message,
			timestamp: m.createdAt ? new Date(m.createdAt).getTime() : Date.now()
		})),
		userDecks
	};
};

export const actions: Actions = {
	start: async ({ params, locals, request }) => {
		if (!locals.user) throw redirect(303, '/login');

		const authError = await requireGameOwnerOrAdmin(params.gameId, locals.user.id, locals.user.role);
		if (authError) return fail(403, { error: authError });

		// Auto-join owner as player if not already joined
		const existingPlayer = await findPlayerInGame(params.gameId, locals.user.id);

		if (!existingPlayer) {
			const formData = await request.formData();
			const deckId = formData.get('deckId')?.toString() || null;

			let card: string[] | null = null;
			if (deckId) {
				const deck = await db
					.select({ phraseIds: playerDeck.phraseIds })
					.from(playerDeck)
					.where(eq(playerDeck.id, deckId))
					.get();
				if (deck) {
					card = deck.phraseIds as string[];
				}
			}

			await db.insert(gamePlayer).values({
				gameId: params.gameId,
				userId: locals.user.id,
				deckId,
				card,
				marks: [],
				scoredPatterns: [],
				score: 0
			});
		}

		const result = await startGame(params.gameId);
		if (result.error) return fail(400, { error: result.error });

		return { success: true };
	},

	end: async ({ params, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const authError = await requireGameOwnerOrAdmin(params.gameId, locals.user.id, locals.user.role);
		if (authError) return fail(403, { error: authError });

		const result = await endGame(params.gameId);
		if (result.error) return fail(400, { error: result.error });

		return { success: true };
	},

	delete: async ({ params, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const authError = await requireGameOwnerOrAdmin(params.gameId, locals.user.id, locals.user.role);
		if (authError) return fail(403, { error: authError });

		await db.delete(gameSession).where(eq(gameSession.id, params.gameId));
		throw redirect(303, '/');
	}
};
