import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { gameSession, gamePlayer, gameResult, chatMessage } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { broadcast } from '$lib/server/sse';
import { getGamePlayers } from '$lib/server/db/queries';
import { displayName } from '$lib/types';

export async function startGame(gameId: string): Promise<{ error?: string }> {
	const game = await db
		.select({ status: gameSession.status })
		.from(gameSession)
		.where(eq(gameSession.id, gameId))
		.get();

	if (!game) return { error: 'Game not found' };
	if (game.status !== 'lobby') return { error: 'Game is not in lobby state.' };

	const players = await db
		.select({ id: gamePlayer.id, card: gamePlayer.card })
		.from(gamePlayer)
		.where(eq(gamePlayer.gameId, gameId));

	const missingCards = players.filter((p) => !p.card || (p.card as string[]).length === 0);
	if (missingCards.length > 0) {
		return { error: `${missingCards.length} player(s) haven't selected a deck yet.` };
	}

	await db.update(gameSession).set({ status: 'active' }).where(eq(gameSession.id, gameId));

	broadcast(gameId, 'game_started', {});
	return {};
}

export async function endGame(gameId: string): Promise<{ error?: string }> {
	const game = await db
		.select({ status: gameSession.status })
		.from(gameSession)
		.where(eq(gameSession.id, gameId))
		.get();

	if (!game) return { error: 'Game not found' };
	if (game.status !== 'active') return { error: 'Game is not active.' };

	const finishedAt = new Date();

	await db
		.update(gameSession)
		.set({ status: 'finished', finishedAt })
		.where(eq(gameSession.id, gameId));

	const endPlayers = await getGamePlayers(gameId);

	if (endPlayers.length > 0) {
		await db.insert(gameResult).values(
			endPlayers.map((p) => ({
				gameId,
				userId: p.userId,
				username: displayName(p),
				score: p.score,
				finishedAt
			}))
		);
	}

	broadcast(gameId, 'game_ended', {
		finalScores: endPlayers.map((p) => ({
			username: displayName(p),
			score: p.score
		}))
	});

	await db.delete(chatMessage).where(eq(chatMessage.gameId, gameId));

	return {};
}

export async function restartGame(gameId: string): Promise<{ error?: string }> {
	if (!dev) return { error: 'Restart is only available in development mode.' };

	const game = db
		.select({ status: gameSession.status })
		.from(gameSession)
		.where(eq(gameSession.id, gameId))
		.get();

	if (!game) return { error: 'Game not found' };

	// Reset game to lobby
	await db
		.update(gameSession)
		.set({ status: 'lobby', finishedAt: null })
		.where(eq(gameSession.id, gameId));

	// Reset all players' scores/marks
	await db
		.update(gamePlayer)
		.set({ marks: [], scoredPatterns: [], score: 0 })
		.where(eq(gamePlayer.gameId, gameId));

	// Remove game results
	await db.delete(gameResult).where(eq(gameResult.gameId, gameId));

	// Clear chat
	await db.delete(chatMessage).where(eq(chatMessage.gameId, gameId));

	broadcast(gameId, 'game_restarted', {});

	return {};
}
