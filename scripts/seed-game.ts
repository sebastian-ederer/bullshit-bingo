import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth';
import { username, admin } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/server/db/schema';

// ── CLI args ────────────────────────────────────────────────
const args = process.argv.slice(2);

function getArg(name: string, fallback: string): string {
	const idx = args.indexOf(`--${name}`);
	return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const playerCount = parseInt(getArg('players', '30'), 10);
const gameCode = getArg('code', '');

// ── DB + Auth setup (same as seed.ts) ───────────────────────
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const client = new Database(dbUrl);
const db = drizzle(client, { schema });

const auth = betterAuth({
	baseURL: process.env.ORIGIN ?? 'http://localhost:3000',
	secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret',
	database: drizzleAdapter(db, { provider: 'sqlite', schema }),
	emailAndPassword: { enabled: true },
	plugins: [username(), admin()]
});

// ── Helpers ─────────────────────────────────────────────────
function generateGameCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let code = '';
	for (let i = 0; i < 4; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

// ── Main ────────────────────────────────────────────────────
async function seedGame() {
	// Fetch all phrase IDs
	const phrases = await db.select({ id: schema.topicPhrase.id }).from(schema.topicPhrase).all();

	if (phrases.length < 9) {
		console.error(`Need at least 9 phrases in topic_phrase, found ${phrases.length}`);
		process.exit(1);
	}

	const phraseIds = phrases.map((p) => p.id);

	// Resolve or create game
	let gameId: string;
	let finalCode: string;

	if (gameCode) {
		// Find existing game by code
		const game = await db
			.select({ id: schema.gameSession.id, status: schema.gameSession.status })
			.from(schema.gameSession)
			.where(eq(schema.gameSession.code, gameCode))
			.get();

		if (!game) {
			console.error(`No game found with code "${gameCode}"`);
			process.exit(1);
		}
		if (game.status === 'finished') {
			console.error(`Game "${gameCode}" is already finished`);
			process.exit(1);
		}
		gameId = game.id;
		finalCode = gameCode;
		console.log(`Found existing game: ${finalCode} (${game.status})`);
	} else {
		// Find admin user to own the game
		const adminUser = client.prepare("SELECT id FROM user WHERE role = 'admin' LIMIT 1").get() as
			| { id: string }
			| undefined;

		if (!adminUser) {
			console.error('No admin user found. Run `pnpm db:seed` first.');
			process.exit(1);
		}

		finalCode = generateGameCode();
		const [game] = await db
			.insert(schema.gameSession)
			.values({
				code: finalCode,
				name: `Load Test ${finalCode}`,
				createdBy: adminUser.id
			})
			.returning();

		gameId = game.id;
		console.log(`Created game: ${finalCode}`);
	}

	// Create bot users and join them
	let joined = 0;

	for (let i = 1; i <= playerCount; i++) {
		const botUsername = `bot_${i}`;
		const botEmail = `bot_${i}@bingo.local`;
		let userId: string;

		// Create or find user
		try {
			const result = await auth.api.signUpEmail({
				body: {
					username: botUsername,
					email: botEmail,
					password: 'botbot123',
					name: `Bot ${i}`
				}
			});
			userId = result.user.id;
		} catch {
			// User likely already exists — look up by username
			const existing = client.prepare('SELECT id FROM user WHERE username = ?').get(botUsername) as
				| { id: string }
				| undefined;

			if (!existing) {
				console.error(`Failed to create or find user ${botUsername}, skipping`);
				continue;
			}
			userId = existing.id;
		}

		// Pick 9 random phrases for the deck
		const deckPhrases = shuffle(phraseIds).slice(0, 9);

		// Create a deck
		const [deck] = await db
			.insert(schema.playerDeck)
			.values({
				userId,
				name: `Bot ${i} Deck`,
				phraseIds: deckPhrases
			})
			.returning();

		// Join the game (skip if already joined)
		try {
			await db.insert(schema.gamePlayer).values({
				gameId,
				userId,
				deckId: deck.id,
				card: deckPhrases,
				marks: [],
				scoredPatterns: [],
				score: 0
			});
			joined++;
		} catch {
			// Already joined (unique constraint)
			console.log(`  ${botUsername} already in game, skipped`);
		}
	}

	console.log(`\n${joined} bot players joined game ${finalCode}`);
	console.log(`Open in browser: http://localhost:5173/game/${gameId}`);

	client.close();
}

seedGame().catch((e) => {
	console.error('Seed game failed:', e);
	process.exit(1);
});
