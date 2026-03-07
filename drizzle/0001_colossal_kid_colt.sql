CREATE INDEX `chat_message_user_id_idx` ON `chat_message` (`user_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_combo` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`bonus_points` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_combo`("id", "name", "bonus_points", "created_by", "created_at") SELECT "id", "name", "bonus_points", "created_by", "created_at" FROM `combo`;--> statement-breakpoint
DROP TABLE `combo`;--> statement-breakpoint
ALTER TABLE `__new_combo` RENAME TO `combo`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `combo_created_by_idx` ON `combo` (`created_by`);--> statement-breakpoint
CREATE TABLE `__new_game_player` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`user_id` text NOT NULL,
	`deck_id` text,
	`card` text,
	`marks` text NOT NULL,
	`scored_patterns` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`deck_id`) REFERENCES `player_deck`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_game_player`("id", "game_id", "user_id", "deck_id", "card", "marks", "scored_patterns", "score", "joined_at") SELECT "id", "game_id", "user_id", "deck_id", "card", "marks", "scored_patterns", "score", "joined_at" FROM `game_player`;--> statement-breakpoint
DROP TABLE `game_player`;--> statement-breakpoint
ALTER TABLE `__new_game_player` RENAME TO `game_player`;--> statement-breakpoint
CREATE UNIQUE INDEX `game_player_unique` ON `game_player` (`game_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `game_player_user_id_idx` ON `game_player` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_game_result` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`user_id` text NOT NULL,
	`username` text NOT NULL,
	`score` integer NOT NULL,
	`finished_at` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_game_result`("id", "game_id", "user_id", "username", "score", "finished_at") SELECT "id", "game_id", "user_id", "username", "score", "finished_at" FROM `game_result`;--> statement-breakpoint
DROP TABLE `game_result`;--> statement-breakpoint
ALTER TABLE `__new_game_result` RENAME TO `game_result`;--> statement-breakpoint
CREATE INDEX `game_result_user_id_idx` ON `game_result` (`user_id`);--> statement-breakpoint
CREATE INDEX `game_result_game_id_idx` ON `game_result` (`game_id`);--> statement-breakpoint
CREATE TABLE `__new_game_session` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`created_by` text NOT NULL,
	`status` text DEFAULT 'lobby' NOT NULL,
	`created_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_game_session`("id", "code", "name", "created_by", "status", "created_at", "finished_at") SELECT "id", "code", "name", "created_by", "status", "created_at", "finished_at" FROM `game_session`;--> statement-breakpoint
DROP TABLE `game_session`;--> statement-breakpoint
ALTER TABLE `__new_game_session` RENAME TO `game_session`;--> statement-breakpoint
CREATE UNIQUE INDEX `game_session_code_unique` ON `game_session` (`code`);--> statement-breakpoint
CREATE INDEX `game_session_created_by_idx` ON `game_session` (`created_by`);--> statement-breakpoint
CREATE INDEX `game_session_status_created_at_idx` ON `game_session` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `__new_player_deck` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`phrase_ids` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_player_deck`("id", "user_id", "name", "phrase_ids", "created_at") SELECT "id", "user_id", "name", "phrase_ids", "created_at" FROM `player_deck`;--> statement-breakpoint
DROP TABLE `player_deck`;--> statement-breakpoint
ALTER TABLE `__new_player_deck` RENAME TO `player_deck`;--> statement-breakpoint
CREATE INDEX `player_deck_user_id_idx` ON `player_deck` (`user_id`);