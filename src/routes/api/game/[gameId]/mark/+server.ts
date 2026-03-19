import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { topicPhrase, chatMessage, gamePlayer } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { calculateMarkScore, recalculateScore } from '$lib/server/game/scoring';
import { broadcast } from '$lib/server/sse';
import { loadCombosWithFields, getGamePlayers, findPlayerInGame, findGameStatus } from '$lib/server/db/queries';
import { displayName } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals, request }) => {
	if (!locals.user) throw error(401, 'Not authenticated');

	const { cellIndex } = await request.json();
	if (typeof cellIndex !== 'number' || cellIndex < 0 || cellIndex > 8) {
		throw error(400, 'Invalid cell index');
	}

	const game = await findGameStatus(params.gameId);
	if (!game) throw error(404, 'Game not found');
	if (game.status !== 'active') throw error(400, 'Game is not active');

	const player = await findPlayerInGame(params.gameId, locals.user.id);

	if (!player) throw error(403, 'Not a player in this game');
	if (!player.card) throw error(400, 'No card assigned yet');

	const marks = player.marks as number[];
	const cardPhraseIds = player.card as string[];
	const isUnmarking = marks.includes(cellIndex);

	const comboData = await loadCombosWithFields();

	if (isUnmarking) {
		// Remove the mark
		const newMarks = marks.filter((m) => m !== cellIndex);
		const markedPhraseIds = newMarks.map((i) => cardPhraseIds[i]);

		// Load base points for all marked phrases
		const phrases = markedPhraseIds.length > 0
			? await db
				.select({ id: topicPhrase.id, basePoints: topicPhrase.basePoints })
				.from(topicPhrase)
				.where(inArray(topicPhrase.id, markedPhraseIds))
			: [];
		const phrasePointsMap = new Map(phrases.map((p) => [p.id, p.basePoints]));

		const { totalScore, activeComboIds } = recalculateScore(
			markedPhraseIds,
			cardPhraseIds,
			comboData,
			phrasePointsMap
		);

		await db
			.update(gamePlayer)
			.set({
				marks: newMarks,
				scoredPatterns: activeComboIds,
				score: totalScore
			})
			.where(eq(gamePlayer.id, player.id));

		// Broadcast updated scoreboard
		const allPlayers = await getGamePlayers(params.gameId);
		broadcast(params.gameId, 'score_update', {
			scores: allPlayers.map((p) => ({
				username: displayName(p),
				score: p.score
			}))
		});

		return json({ marks: newMarks, score: totalScore, newCombos: [] });
	}

	// Marking a new cell
	const markedPhraseId = cardPhraseIds[cellIndex];
	const phrase = await db
		.select({ basePoints: topicPhrase.basePoints })
		.from(topicPhrase)
		.where(eq(topicPhrase.id, markedPhraseId))
		.get();

	const fieldBasePoints = phrase?.basePoints ?? 0;

	const newMarks = [...marks, cellIndex];
	const allMarkedPhraseIds = newMarks.map((i) => cardPhraseIds[i]);
	const scoredPatterns = player.scoredPatterns as string[];

	const { pointsEarned, newCombos } = calculateMarkScore(
		markedPhraseId,
		allMarkedPhraseIds,
		cardPhraseIds,
		comboData,
		scoredPatterns,
		fieldBasePoints
	);

	const newScore = player.score + pointsEarned;
	const updatedScoredPatterns = [...scoredPatterns, ...newCombos.map((c) => c.id)];

	await db
		.update(gamePlayer)
		.set({
			marks: newMarks,
			scoredPatterns: updatedScoredPatterns,
			score: newScore
		})
		.where(eq(gamePlayer.id, player.id));

	const username = displayName(locals.user);

	// Broadcast combo events and system chat messages
	for (const c of newCombos) {
		broadcast(params.gameId, 'combo_completed', {
			username,
			comboName: c.name,
			points: c.bonusPoints
		});

		await db.insert(chatMessage).values({
			gameId: params.gameId,
			userId: 'system',
			message: `${username} completed combo "${c.name}" (+${c.bonusPoints} pts)`
		});

		broadcast(params.gameId, 'chat', {
			userId: 'system',
			username: 'System',
			message: `${username} completed combo "${c.name}" (+${c.bonusPoints} pts)`,
			timestamp: Date.now()
		});
	}

	// Broadcast updated scoreboard if points changed
	if (pointsEarned > 0) {
		const allPlayers = await getGamePlayers(params.gameId);

		broadcast(params.gameId, 'score_update', {
			scores: allPlayers.map((p) => ({
				username: displayName(p),
				score: p.score
			}))
		});
	}

	return json({ marks: newMarks, score: newScore, newCombos: newCombos.map((c) => c.name) });
};
