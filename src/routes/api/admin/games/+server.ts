import { json, error } from '@sveltejs/kit';
import { loadGamesList } from '$lib/server/db/queries';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'admin') throw error(403, 'Forbidden');

	const cursor = url.searchParams.get('cursor');
	return json(await loadGamesList(cursor));
};
