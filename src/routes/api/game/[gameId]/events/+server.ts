import { error } from '@sveltejs/kit';
import { addClient, removeClient } from '$lib/server/sse';
import { findPlayerInGame, findGameStatus } from '$lib/server/db/queries';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Not authenticated');

	const isAdmin = locals.user.role === 'admin';

	if (!isAdmin) {
		const game = await findGameStatus(params.gameId);
		const isOwner = game?.createdBy === locals.user.id;

		if (!isOwner) {
			const player = await findPlayerInGame(params.gameId, locals.user.id);
			if (!player) throw error(403, 'Not a player in this game');
		}
	}

	const gameId = params.gameId;
	let interval: ReturnType<typeof setInterval> | undefined;
	let controller: ReadableStreamDefaultController | undefined;

	const stream = new ReadableStream({
		start(ctrl) {
			controller = ctrl;
			addClient(gameId, ctrl);

			// Send initial ping
			const ping = new TextEncoder().encode(': ping\n\n');
			ctrl.enqueue(ping);

			// Keepalive every 30s
			interval = setInterval(() => {
				try {
					ctrl.enqueue(ping);
				} catch {
					clearInterval(interval);
				}
			}, 30000);
		},
		cancel() {
			if (interval) clearInterval(interval);
			if (controller) removeClient(gameId, controller);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
