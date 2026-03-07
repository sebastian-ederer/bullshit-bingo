import { db } from '$lib/server/db';
import { gameSession } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { generateGameCode, cleanupStaleGames, hasValidDeck } from '$lib/server/db/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	if (!(await hasValidDeck(locals.user.id))) throw redirect(303, '/?error=no-deck');

	await cleanupStaleGames();

	const code = generateGameCode();
	const [game] = await db
		.insert(gameSession)
		.values({
			code,
			name: `Game ${code}`,
			createdBy: locals.user.id
		})
		.returning();

	throw redirect(303, `/game/${game.id}`);
};
