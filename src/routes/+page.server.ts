import { hasValidDeck } from '$lib/server/db/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { hasValidDeck: false };
	return { hasValidDeck: await hasValidDeck(locals.user.id) };
};
