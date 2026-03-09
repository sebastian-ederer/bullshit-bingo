import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { user } from './auth.schema';

// ── Topic Phrases ────────────────────────────────────────────

export const topicPhrase = sqliteTable('topic_phrase', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	subtitle: text('subtitle'),
	basePoints: integer('base_points').notNull().default(0)
});

// ── Combos ───────────────────────────────────────────────────

export const combo = sqliteTable(
	'combo',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		name: text('name').notNull(),
		bonusPoints: integer('bonus_points').notNull().default(0),
		createdBy: text('created_by')
			.notNull()
			.references(() => user.id),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [index('combo_created_by_idx').on(table.createdBy)]
);

export const comboField = sqliteTable(
	'combo_field',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		comboId: text('combo_id')
			.notNull()
			.references(() => combo.id, { onDelete: 'cascade' }),
		phraseId: text('phrase_id')
			.notNull()
			.references(() => topicPhrase.id, { onDelete: 'cascade' })
	},
	(table) => [index('combo_field_combo_id_idx').on(table.comboId)]
);

// ── Player Decks ─────────────────────────────────────────────

export const playerDeck = sqliteTable(
	'player_deck',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.notNull()
			.references(() => user.id),
		name: text('name').notNull(),
		phraseIds: text('phrase_ids', { mode: 'json' })
			.notNull()
			.$type<string[]>(),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [index('player_deck_user_id_idx').on(table.userId)]
);

// ── Game Sessions ────────────────────────────────────────────

export const gameSession = sqliteTable(
	'game_session',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		code: text('code').notNull().unique(),
		name: text('name').notNull(),
		createdBy: text('created_by')
			.notNull()
			.references(() => user.id),
		status: text('status', { enum: ['lobby', 'active', 'finished'] })
			.notNull()
			.default('lobby'),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		finishedAt: integer('finished_at', { mode: 'timestamp' })
	},
	(table) => [
		index('game_session_created_by_idx').on(table.createdBy),
		index('game_session_status_created_at_idx').on(table.status, table.createdAt)
	]
);

// ── Game Players ─────────────────────────────────────────────

export const gamePlayer = sqliteTable(
	'game_player',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		gameId: text('game_id')
			.notNull()
			.references(() => gameSession.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id),
		deckId: text('deck_id').references(() => playerDeck.id, { onDelete: 'set null' }),
		card: text('card', { mode: 'json' }).$type<string[]>(),
		marks: text('marks', { mode: 'json' })
			.notNull()
			.$type<number[]>()
			.$defaultFn(() => []),
		scoredPatterns: text('scored_patterns', { mode: 'json' })
			.notNull()
			.$type<string[]>()
			.$defaultFn(() => []),
		score: integer('score').notNull().default(0),
		joinedAt: integer('joined_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		uniqueIndex('game_player_unique').on(table.gameId, table.userId),
		index('game_player_user_id_idx').on(table.userId)
	]
);

// ── Chat Messages ────────────────────────────────────────────

export const chatMessage = sqliteTable(
	'chat_message',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		gameId: text('game_id')
			.notNull()
			.references(() => gameSession.id, { onDelete: 'cascade' }),
		userId: text('user_id').notNull(),
		message: text('message').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		index('chat_message_game_id_idx').on(table.gameId),
		index('chat_message_user_id_idx').on(table.userId)
	]
);

// ── Game Results (Leaderboard) ───────────────────────────────

export const gameResult = sqliteTable(
	'game_result',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		gameId: text('game_id')
			.notNull()
			.references(() => gameSession.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id),
		username: text('username').notNull(),
		score: integer('score').notNull(),
		finishedAt: integer('finished_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		index('game_result_user_id_idx').on(table.userId),
		index('game_result_game_id_idx').on(table.gameId)
	]
);

// ── Relations ────────────────────────────────────────────────

export const comboRelations = relations(combo, ({ many }) => ({
	fields: many(comboField)
}));

export const comboFieldRelations = relations(comboField, ({ one }) => ({
	combo: one(combo, { fields: [comboField.comboId], references: [combo.id] }),
	phrase: one(topicPhrase, { fields: [comboField.phraseId], references: [topicPhrase.id] })
}));

export const gameSessionRelations = relations(gameSession, ({ many }) => ({
	players: many(gamePlayer),
	messages: many(chatMessage),
	results: many(gameResult)
}));

export const gamePlayerRelations = relations(gamePlayer, ({ one }) => ({
	game: one(gameSession, { fields: [gamePlayer.gameId], references: [gameSession.id] }),
	user: one(user, { fields: [gamePlayer.userId], references: [user.id] })
}));

export const gameResultRelations = relations(gameResult, ({ one }) => ({
	game: one(gameSession, { fields: [gameResult.gameId], references: [gameSession.id] }),
	user: one(user, { fields: [gameResult.userId], references: [user.id] })
}));

export const playerDeckRelations = relations(playerDeck, ({ one }) => ({
	user: one(user, { fields: [playerDeck.userId], references: [user.id] })
}));

// Re-export auth tables
export * from './auth.schema';
