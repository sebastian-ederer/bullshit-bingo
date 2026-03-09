PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
	FOREIGN KEY (`deck_id`) REFERENCES `player_deck`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_game_player`("id", "game_id", "user_id", "deck_id", "card", "marks", "scored_patterns", "score", "joined_at") SELECT "id", "game_id", "user_id", "deck_id", "card", "marks", "scored_patterns", "score", "joined_at" FROM `game_player`;--> statement-breakpoint
DROP TABLE `game_player`;--> statement-breakpoint
ALTER TABLE `__new_game_player` RENAME TO `game_player`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `game_player_unique` ON `game_player` (`game_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `game_player_user_id_idx` ON `game_player` (`user_id`);