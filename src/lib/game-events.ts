/**
 * Client-side SSE helper for connecting to a game's event stream.
 * Auto-reconnects with exponential backoff on error.
 */

export interface GameEventHandlers {
	player_joined?: (data: { username: string }) => void;
	player_left?: (data: { username: string }) => void;
	game_started?: (data: Record<string, never>) => void;
	game_ended?: (data: { finalScores: { username: string; score: number }[] }) => void;
	score_update?: (data: { scores: { username: string; score: number }[] }) => void;
	combo_completed?: (data: { username: string; comboName: string; points: number }) => void;
	chat?: (data: { userId?: string; username: string; message: string; timestamp: number }) => void;
}

export function connectToGame(
	gameId: string,
	handlers: GameEventHandlers
): { close: () => void } {
	let source: EventSource | null = null;
	let closed = false;
	let backoff = 1000;
	let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

	function connect() {
		if (closed) return;

		source = new EventSource(`/api/game/${gameId}/events`);

		source.onopen = () => {
			backoff = 1000;
		};

		for (const [event, handler] of Object.entries(handlers)) {
			if (!handler) continue;
			source.addEventListener(event, (e: MessageEvent) => {
				try {
					handler(JSON.parse(e.data));
				} catch {
					// Ignore malformed events
				}
			});
		}

		source.onerror = () => {
			source?.close();
			source = null;
			if (closed) return;

			reconnectTimer = setTimeout(() => {
				connect();
			}, backoff);
			backoff = Math.min(backoff * 2, 10000);
		};
	}

	connect();

	return {
		close() {
			closed = true;
			if (reconnectTimer) clearTimeout(reconnectTimer);
			source?.close();
			source = null;
		}
	};
}
