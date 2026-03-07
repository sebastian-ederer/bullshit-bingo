import { db } from '$lib/server/db';
import { gameSession } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { getGamePlayers } from '$lib/server/db/queries';
import { startGame, endGame } from '$lib/server/game/actions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const game = await db
		.select({
			id: gameSession.id,
			code: gameSession.code,
			name: gameSession.name,
			status: gameSession.status,
			createdAt: gameSession.createdAt,
			finishedAt: gameSession.finishedAt
		})
		.from(gameSession)
		.where(eq(gameSession.id, params.gameId))
		.get();

	if (!game) throw error(404, 'Game not found');

	const players = await getGamePlayers(params.gameId);

	return { game, players };
};

export const actions: Actions = {
	start: async ({ params }) => {
		const result = await startGame(params.gameId);
		if (result.error) return fail(400, { error: result.error });
		return { success: true };
	},

	end: async ({ params }) => {
		const result = await endGame(params.gameId);
		if (result.error) return fail(400, { error: result.error });
		return { success: true };
	},

	delete: async ({ params }) => {
		await db.delete(gameSession).where(eq(gameSession.id, params.gameId));
		throw redirect(303, '/admin/games');
	}
};
