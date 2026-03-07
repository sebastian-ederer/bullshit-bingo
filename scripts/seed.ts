import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth';
import { username, admin } from 'better-auth/plugins';
import * as schema from '../src/lib/server/db/schema';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';

const client = new Database(dbUrl);
const db = drizzle(client, { schema });

const auth = betterAuth({
	baseURL: process.env.ORIGIN ?? 'http://localhost:3000',
	secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret',
	database: drizzleAdapter(db, { provider: 'sqlite', schema }),
	emailAndPassword: { enabled: true },
	plugins: [username(), admin()]
});

const phrases = [
	{ title: 'Synergy', subtitle: 'Leverage our synergies', basePoints: 10 },
	{ title: 'Circle Back', subtitle: "Let's circle back on that", basePoints: 10 },
	{ title: 'Low-Hanging Fruit', subtitle: 'Quick wins first', basePoints: 10 },
	{ title: 'Move the Needle', subtitle: 'Make a real impact', basePoints: 15 },
	{ title: 'Deep Dive', subtitle: "Let's do a deep dive", basePoints: 10 },
	{ title: 'Bandwidth', subtitle: "I don't have the bandwidth", basePoints: 10 },
	{ title: 'Pivot', subtitle: 'We need to pivot', basePoints: 15 },
	{ title: 'Align', subtitle: 'Get aligned on this', basePoints: 10 },
	{ title: 'Unpack', subtitle: "Let's unpack that", basePoints: 10 },
	{ title: 'Take Offline', subtitle: "Let's take this offline", basePoints: 10 },
	{ title: 'Touch Base', subtitle: "I'll touch base with you", basePoints: 10 },
	{ title: 'Bleeding Edge', subtitle: 'Cutting-edge innovation', basePoints: 20 },
	{ title: 'Boil the Ocean', subtitle: "We can't boil the ocean", basePoints: 15 },
	{ title: 'Run It Up the Flagpole', subtitle: 'See who salutes', basePoints: 15 },
	{ title: 'Parking Lot', subtitle: "Let's parking lot that", basePoints: 10 },
	{ title: 'Action Items', subtitle: 'What are the action items?', basePoints: 10 },
	{ title: 'Value-Add', subtitle: "What's the value-add?", basePoints: 10 },
	{ title: 'Drill Down', subtitle: "Let's drill down into it", basePoints: 10 },
	{ title: 'Ecosystem', subtitle: 'Our partner ecosystem', basePoints: 15 },
	{ title: 'Thought Leader', subtitle: 'Be a thought leader', basePoints: 20 },
	{ title: 'Win-Win', subtitle: "It's a win-win situation", basePoints: 10 },
	{ title: 'Paradigm Shift', subtitle: 'A total paradigm shift', basePoints: 20 },
	{ title: 'Disrupt', subtitle: 'Disrupt the industry', basePoints: 15 },
	{ title: 'North Star', subtitle: "What's our north star?", basePoints: 15 },
	{ title: 'Scalable', subtitle: 'Is it scalable?', basePoints: 10 },
	{ title: 'Dogfood', subtitle: 'Eat our own dogfood', basePoints: 20 },
	{ title: 'Tiger Team', subtitle: 'Assemble a tiger team', basePoints: 15 },
	{ title: 'Bikeshedding', subtitle: 'Debating trivial details', basePoints: 20 },
	{ title: 'On My Radar', subtitle: "It's on my radar", basePoints: 10 },
	{ title: 'ROI', subtitle: "What's the ROI on this?", basePoints: 10 }
];

const combos = [
	{
		name: 'Corporate Bingo Line',
		bonusPoints: 50,
		phraseTitles: ['Synergy', 'Circle Back', 'Low-Hanging Fruit']
	},
	{
		name: 'Strategy Buzzwords',
		bonusPoints: 40,
		phraseTitles: ['Pivot', 'North Star', 'Paradigm Shift']
	},
	{
		name: 'Meeting Survivor',
		bonusPoints: 30,
		phraseTitles: ['Take Offline', 'Parking Lot', 'Action Items']
	},
	{
		name: 'Tech Bro Speak',
		bonusPoints: 60,
		phraseTitles: ['Disrupt', 'Scalable', 'Bleeding Edge', 'Dogfood']
	},
	{
		name: 'Overachiever Pack',
		bonusPoints: 45,
		phraseTitles: ['Deep Dive', 'Drill Down', 'Move the Needle']
	}
];

async function seed() {
	const adminExists = client.prepare('SELECT 1 FROM user WHERE username = ?').get(adminUsername);
	if (adminExists) {
		console.log('Database already seeded, skipping.');
		client.close();
		return;
	}

	console.log(`Creating admin user "${adminUsername}"...`);
	const result = await auth.api.signUpEmail({
		body: {
			username: adminUsername,
			email: `${adminUsername}@bingo.local`,
			password: adminPassword,
			name: adminUsername
		}
	});
	client.prepare('UPDATE user SET role = ? WHERE id = ?').run('admin', result.user.id);
	console.log(`Admin user "${adminUsername}" created with role "admin".`);

	console.log(`Inserting ${phrases.length} phrases...`);
	const insertPhrase = client.prepare(
		'INSERT INTO topic_phrase (id, title, subtitle, base_points) VALUES (?, ?, ?, ?)'
	);
	const insertPhrases = client.transaction((items: typeof phrases) => {
		for (const p of items) {
			insertPhrase.run(crypto.randomUUID(), p.title, p.subtitle, p.basePoints);
		}
	});
	insertPhrases(phrases);
	console.log('Phrases inserted.');

	const adminRow = client.prepare('SELECT id FROM user WHERE username = ?').get(adminUsername) as
		| { id: string }
		| undefined;
	if (adminRow) {
		console.log(`Inserting ${combos.length} combos...`);
		const allPhrases = client.prepare('SELECT id, title FROM topic_phrase').all() as {
			id: string;
			title: string;
		}[];
		const titleToId = new Map(allPhrases.map((p) => [p.title, p.id]));

		const insertCombo = client.prepare(
			'INSERT INTO combo (id, name, bonus_points, created_by, created_at) VALUES (?, ?, ?, ?, ?)'
		);
		const insertComboField = client.prepare(
			'INSERT INTO combo_field (id, combo_id, phrase_id) VALUES (?, ?, ?)'
		);

		const insertAllCombos = client.transaction((items: typeof combos) => {
			for (const c of items) {
				const comboId = crypto.randomUUID();
				insertCombo.run(comboId, c.name, c.bonusPoints, adminRow.id, Date.now());
				for (const title of c.phraseTitles) {
					const phraseId = titleToId.get(title);
					if (phraseId) {
						insertComboField.run(crypto.randomUUID(), comboId, phraseId);
					} else {
						console.warn(`  Warning: phrase "${title}" not found, skipping in combo "${c.name}"`);
					}
				}
			}
		});
		insertAllCombos(combos);
		console.log('Combos inserted.');
	}

	client.close();
	console.log('Seed complete!');
}

seed().catch((e) => {
	console.error('Seed failed:', e);
	process.exit(1);
});
