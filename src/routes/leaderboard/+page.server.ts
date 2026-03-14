import { db } from '$lib/server/db';
import { gameResult } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
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

	const userId = locals.user?.id;
	let currentUserEntry: (typeof leaderboard)[number] & { rank: number } | null = null;

	if (userId && !leaderboard.some((e) => e.userId === userId)) {
		const rows = await db
			.select({
				userId: gameResult.userId,
				username: gameResult.username,
				totalScore: sql<number>`SUM(${gameResult.score})`.as('total_score'),
				gamesPlayed: sql<number>`COUNT(*)`.as('games_played')
			})
			.from(gameResult)
			.where(sql`${gameResult.userId} = ${userId}`)
			.groupBy(gameResult.userId);

		if (rows.length > 0) {
			const [{ count }] = await db
				.select({ count: sql<number>`COUNT(*)` })
				.from(
					sql`(SELECT ${gameResult.userId} FROM ${gameResult} GROUP BY ${gameResult.userId} HAVING SUM(${gameResult.score}) > ${rows[0].totalScore})`
				);
			currentUserEntry = { ...rows[0], rank: Number(count) + 1 };
		}
	}

	return { leaderboard, currentUserId: userId ?? null, currentUserEntry };
};
