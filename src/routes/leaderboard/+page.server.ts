import { db } from '$lib/server/db';
import { gameResult } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const leaderboard = await db
		.select({
			userId: gameResult.userId,
			username: gameResult.username,
			totalScore: sql<number>`SUM(${gameResult.score})`.as('total_score'),
			gamesPlayed: sql<number>`COUNT(*)`.as('games_played')
		})
		.from(gameResult)
		.groupBy(gameResult.userId)
		.orderBy(sql`total_score DESC`)
		.limit(50);

	return { leaderboard };
};
