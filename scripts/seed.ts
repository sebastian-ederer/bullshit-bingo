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

async function seed() {
	const anyUser = client.prepare('SELECT 1 FROM user LIMIT 1').get();
	if (anyUser) {
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

	client.close();
	console.log('Seed complete!');
}

seed().catch((e) => {
	console.error('Seed failed:', e);
	process.exit(1);
});
