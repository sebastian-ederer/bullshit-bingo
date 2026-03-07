import { db } from '$lib/server/db';
import {
	topicPhrase,
	combo,
	comboField,
	chatMessage,
	gamePlayer,
	gameResult,
	gameSession,
	playerDeck,
	user,
	session,
	account
} from '$lib/server/db/schema';
import { eq, inArray, and, lt, desc, count } from 'drizzle-orm';
import type { PhraseData, ComboData } from '$lib/types';

export type { PhraseData, ComboData };

async function loadAllPhrases(): Promise<PhraseData[]> {
	return db
		.select({
			id: topicPhrase.id,
			title: topicPhrase.title,
			subtitle: topicPhrase.subtitle,
			basePoints: topicPhrase.basePoints
		})
		.from(topicPhrase);
}

export async function loadCombosWithFields(): Promise<ComboData[]> {
	const allCombos = await db.select().from(combo);
	if (allCombos.length === 0) return [];

	const comboIds = allCombos.map((c) => c.id);
	const fields = await db
		.select({ comboId: comboField.comboId, phraseId: comboField.phraseId })
		.from(comboField)
		.where(inArray(comboField.comboId, comboIds));

	const fieldsByCombo = new Map<string, string[]>();
	for (const f of fields) {
		const arr = fieldsByCombo.get(f.comboId);
		if (arr) arr.push(f.phraseId);
		else fieldsByCombo.set(f.comboId, [f.phraseId]);
	}

	return allCombos.map((c) => ({
		id: c.id,
		name: c.name,
		bonusPoints: c.bonusPoints,
		phraseIds: fieldsByCombo.get(c.id) ?? []
	}));
}

export async function loadPhrasesAndCombos(): Promise<{
	phrases: PhraseData[];
	combos: ComboData[];
}> {
	const [phrases, combos] = await Promise.all([loadAllPhrases(), loadCombosWithFields()]);
	return { phrases, combos };
}

export async function getValidPhraseIdSet(): Promise<Set<string>> {
	const allPhrases = await db.select({ id: topicPhrase.id }).from(topicPhrase);
	return new Set(allPhrases.map((p) => p.id));
}

export async function hasValidDeck(userId: string): Promise<boolean> {
	const rawDecks = await db
		.select({ phraseIds: playerDeck.phraseIds })
		.from(playerDeck)
		.where(eq(playerDeck.userId, userId));

	const validPhraseIdSet = await getValidPhraseIdSet();
	return rawDecks.some((d) => {
		const ids = d.phraseIds as string[];
		return ids.filter((id) => validPhraseIdSet.has(id)).length === 9;
	});
}

export async function getGamePlayers(
	gameId: string
): Promise<
	{ id: string; userId: string; username: string | null; name: string | null; score: number }[]
> {
	return db
		.select({
			id: gamePlayer.id,
			userId: gamePlayer.userId,
			username: user.username,
			name: user.name,
			score: gamePlayer.score
		})
		.from(gamePlayer)
		.leftJoin(user, eq(user.id, gamePlayer.userId))
		.where(eq(gamePlayer.gameId, gameId));
}

export async function findPlayerInGame(gameId: string, userId: string) {
	return db
		.select({
			id: gamePlayer.id,
			marks: gamePlayer.marks,
			score: gamePlayer.score,
			scoredPatterns: gamePlayer.scoredPatterns,
			card: gamePlayer.card
		})
		.from(gamePlayer)
		.where(and(eq(gamePlayer.gameId, gameId), eq(gamePlayer.userId, userId)))
		.get();
}

export async function findGameStatus(gameId: string) {
	return db
		.select({
			id: gameSession.id,
			status: gameSession.status,
			createdBy: gameSession.createdBy
		})
		.from(gameSession)
		.where(eq(gameSession.id, gameId))
		.get();
}

export function generateGameCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let code = '';
	for (let i = 0; i < 4; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}

export function deleteUserAndData(userId: string): void {
	db.transaction((tx) => {
		tx.delete(chatMessage).where(eq(chatMessage.userId, userId)).run();
		tx.delete(gamePlayer).where(eq(gamePlayer.userId, userId)).run();
		tx.delete(gameResult).where(eq(gameResult.userId, userId)).run();
		tx.delete(playerDeck).where(eq(playerDeck.userId, userId)).run();
		tx.delete(gameSession).where(eq(gameSession.createdBy, userId)).run();
		tx.delete(account).where(eq(account.userId, userId)).run();
		tx.delete(session).where(eq(session.userId, userId)).run();
		tx.delete(user).where(eq(user.id, userId)).run();
	});
}

export async function requireDeckOwner(deckId: string, userId: string) {
	const deck = await db
		.select({ userId: playerDeck.userId })
		.from(playerDeck)
		.where(eq(playerDeck.id, deckId))
		.get();

	if (!deck || deck.userId !== userId) return null;
	return deck;
}

export async function validateDeckPhraseIds(
	phraseIdsRaw: string | undefined
): Promise<string[] | string> {
	let phraseIds: string[] = [];
	try {
		phraseIds = JSON.parse(phraseIdsRaw ?? '[]');
	} catch {
		return 'Invalid phrase selection.';
	}

	if (phraseIds.length > 9) {
		return 'You can select at most 9 phrases.';
	}

	const validIds = await getValidPhraseIdSet();
	if (!phraseIds.every((id) => validIds.has(id))) {
		return 'Some selected phrases are invalid.';
	}

	return phraseIds;
}

export async function requireGameOwnerOrAdmin(
	gameId: string,
	userId: string,
	userRole: string | null | undefined
): Promise<string | null> {
	const game = await findGameStatus(gameId);
	if (!game) return 'Game not found';

	const isOwner = game.createdBy === userId;
	const isAdmin = userRole === 'admin';
	if (!isOwner && !isAdmin) return 'Not authorized';

	return null;
}

const GAMES_PAGE_SIZE = 20;

export async function loadGamesList(cursor?: string | null) {
	const baseQuery = db
		.select({
			id: gameSession.id,
			code: gameSession.code,
			name: gameSession.name,
			status: gameSession.status,
			createdAt: gameSession.createdAt,
			finishedAt: gameSession.finishedAt,
			playerCount: count(gamePlayer.id)
		})
		.from(gameSession)
		.leftJoin(gamePlayer, eq(gamePlayer.gameId, gameSession.id));

	const filtered = cursor
		? baseQuery.where(lt(gameSession.createdAt, new Date(cursor)))
		: baseQuery;

	const games = await filtered
		.groupBy(gameSession.id)
		.orderBy(desc(gameSession.createdAt))
		.limit(GAMES_PAGE_SIZE + 1);

	const hasMore = games.length > GAMES_PAGE_SIZE;
	if (hasMore) games.pop();

	const nextCursor =
		hasMore && games.length > 0
			? (games[games.length - 1].createdAt?.toISOString() ?? null)
			: null;

	return { games, nextCursor };
}

export function cleanupStaleGames(): void {
	const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
	const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

	db.transaction((tx) => {
		tx.delete(gameSession)
			.where(and(eq(gameSession.status, 'lobby'), lt(gameSession.createdAt, oneHourAgo)))
			.run();

		tx.delete(gameSession)
			.where(and(eq(gameSession.status, 'active'), lt(gameSession.createdAt, oneDayAgo)))
			.run();
	});
}
