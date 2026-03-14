import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		appName: env.APP_NAME || 'Bullshit Bingo',
		user: locals.user
			? {
					id: locals.user.id,
					name: locals.user.name,
					username: locals.user.username,
					role: locals.user.role,
					createdAt: locals.user.createdAt
				}
			: null
	};
};
