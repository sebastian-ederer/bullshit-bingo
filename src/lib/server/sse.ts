/**
 * In-memory SSE connection manager.
 * Tracks ReadableStream controllers per game so we can broadcast events to all connected clients.
 */

const clients = new Map<string, Set<ReadableStreamDefaultController>>();
const encoder = new TextEncoder();

export function addClient(gameId: string, controller: ReadableStreamDefaultController): void {
	if (!clients.has(gameId)) {
		clients.set(gameId, new Set());
	}
	clients.get(gameId)!.add(controller);
}

export function removeClient(gameId: string, controller: ReadableStreamDefaultController): void {
	const controllers = clients.get(gameId);
	if (!controllers) return;

	controllers.delete(controller);
	if (controllers.size === 0) {
		clients.delete(gameId);
	}
}

export function broadcast(gameId: string, event: string, data: unknown): void {
	const controllers = clients.get(gameId);
	if (!controllers) return;

	const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
	const encoded = encoder.encode(payload);

	for (const controller of controllers) {
		try {
			controller.enqueue(encoded);
		} catch {
			// Client disconnected; clean up on next removal
			controllers.delete(controller);
		}
	}
}
