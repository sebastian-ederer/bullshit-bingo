import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { username, admin } from 'better-auth/plugins';
import { lt } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { session as sessionTable } from '$lib/server/db/schema';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true },
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // refresh session token every 24h
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5 // cache session in cookie for 5 min (reduces DB lookups)
		}
	},
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					// Clean up expired sessions for this user on new login
					const now = new Date();
					await db
						.delete(sessionTable)
						.where(lt(sessionTable.expiresAt, now));
					return { data: session };
				}
			}
		}
	},
	plugins: [
		username({
			usernameValidator: (u) => /^[a-zA-Z0-9_.\-]+$/.test(u)
		}),
		admin(),
		sveltekitCookies(getRequestEvent) // keep this last
	]
});
