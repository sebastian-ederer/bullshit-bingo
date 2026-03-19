import { db } from '$lib/server/db';
import { gameSession } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import { findGameStatus } from '$lib/server/db/queries';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const game = await findGameStatus(params.gameId);
	if (!game) return json({ error: 'Not found' }, { status: 404 });
	if (game.createdBy !== locals.user.id) return json({ error: 'Forbidden' }, { status: 403 });
	if (game.status !== 'lobby') return json({ error: 'Can only abandon lobby games' }, { status: 400 });

	await db
		.delete(gameSession)
		.where(and(eq(gameSession.id, params.gameId), eq(gameSession.createdBy, locals.user.id)));

	return json({ success: true });
};
