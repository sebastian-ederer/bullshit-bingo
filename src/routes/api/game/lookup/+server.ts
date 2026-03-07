import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { gameSession } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get('code')?.toUpperCase();
	if (!code) throw error(400, 'Code is required');

	const game = await db.query.gameSession.findFirst({
		where: eq(gameSession.code, code)
	});

	if (!game) throw error(404, 'Game not found');

	return json({ gameId: game.id });
};
