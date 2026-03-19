import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { gameSession, gamePlayer } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { broadcast } from '$lib/server/sse';
import { findGameStatus } from '$lib/server/db/queries';
import { displayName } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Not authenticated');

	const game = await findGameStatus(params.gameId);

	if (!game) throw error(404, 'Game not found');
	if (game.status === 'finished') throw error(400, 'Game has already finished');

	// Delete this player's row
	await db
		.delete(gamePlayer)
		.where(and(eq(gamePlayer.gameId, params.gameId), eq(gamePlayer.userId, locals.user.id)));

	// If leaving user is the owner, transfer ownership to next player
	if (game.createdBy === locals.user.id) {
		const nextPlayer = await db
			.select({ userId: gamePlayer.userId })
			.from(gamePlayer)
			.where(eq(gamePlayer.gameId, params.gameId))
			.limit(1)
			.get();

		if (nextPlayer) {
			await db
				.update(gameSession)
				.set({ createdBy: nextPlayer.userId })
				.where(eq(gameSession.id, params.gameId));
		}
		// If no players remain, keep the session alive —
		// the next user to join will become the new host.
	}

	broadcast(params.gameId, 'player_left', {
		username: displayName(locals.user)
	});

	return json({ success: true });
};
