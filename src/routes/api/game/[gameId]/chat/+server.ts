import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { chatMessage } from '$lib/server/db/schema';
import { broadcast } from '$lib/server/sse';
import { findPlayerInGame } from '$lib/server/db/queries';
import { displayName } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals, request }) => {
	if (!locals.user) throw error(401, 'Not authenticated');

	const { message } = await request.json();
	if (!message || typeof message !== 'string' || message.trim().length === 0) {
		throw error(400, 'Message is required');
	}

	// Verify player is in the game
	const player = await findPlayerInGame(params.gameId, locals.user.id);

	if (!player) throw error(403, 'Not a player in this game');

	const trimmed = message.trim().slice(0, 500);

	await db.insert(chatMessage).values({
		gameId: params.gameId,
		userId: locals.user.id,
		message: trimmed
	});

	broadcast(params.gameId, 'chat', {
		userId: locals.user.id,
		username: displayName(locals.user),
		message: trimmed,
		timestamp: Date.now()
	});

	return json({ ok: true });
};
