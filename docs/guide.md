# Bullshit Bingo — User Guide

A real-time multiplayer bingo game where you mark buzzwords and jargon as they come up in meetings, talks, or everyday life. Compete with friends, earn points, and climb the leaderboard.

## Table of Contents

- [Phrases](#phrases)
- [Decks](#decks)
- [Combos](#combos)
- [Scoring](#scoring)
- [Creating a Game](#creating-a-game)
- [Joining a Game](#joining-a-game)
- [In-Game Features](#in-game-features)
- [Ending a Game](#ending-a-game)
- [Leaderboard](#leaderboard)
- [Admin Panel](#admin-panel)

---

## Phrases

Phrases are the building blocks of every bingo card. Each phrase represents a buzzword or piece of jargon you might hear — for example, _"Let's circle back"_ or _"Synergy"_.

Every phrase has:

- **Title** — the main text shown on your bingo card
- **Subtitle** _(optional)_ — extra context or a real-world example of the phrase
- **Base points** — the number of points you earn when you mark it

Phrases are created and managed by admins. As a player, you pick from the available pool when building your decks.

## Decks

A deck is your personal selection of **exactly 9 phrases** that form your 3×3 bingo card. You can create multiple decks and choose which one to play with when joining a game.

### Creating a deck

1. Go to **My Decks** from the navigation menu.
2. Give your deck a name and select 9 phrases from the available pool.
3. Save when you have exactly 9 phrases selected.

### Rules

- A deck must contain **exactly 9 phrases** to be valid. Incomplete decks (fewer than 9) cannot be used in games.
- If an admin deletes a phrase that's in one of your decks, that deck becomes invalid until you replace the missing phrase.
- You'll be warned if you try to join a game with an invalid deck.

## Combos

Combos are named collections of 2 or more phrases that award **bonus points** when completed. If all the phrases in a combo are on your card _and_ you've marked every one of them, you earn the combo's bonus on top of the individual phrase points.

### Combo indicators in the deck builder

When building a deck, combos are displayed alongside the phrase list with visual indicators:

- **Complete** (green border) — all phrases in the combo are in your deck
- **Partial** (highlighted border) — some phrases are in your deck
- **Incomplete** (faded) — none of the combo's phrases are in your deck

Use these indicators to build decks that maximize your combo potential.

### Combo rules

- A combo only triggers when **all** its phrases are on your card **and** marked.
- Each combo scores **once per game** — no double-scoring.
- Combo completions are announced in the game chat so everyone knows.

## Scoring

Your score is a running total that updates in real time:

1. **Mark a phrase** → earn its **base points**.
2. **Complete a combo** → earn the combo's **bonus points** on top of the base points from the phrase you just marked.

**Example:** You mark a phrase worth 10 points. That phrase also happens to be the last unmarked piece of a combo worth 40 bonus points. You earn 50 points total for that single action (10 base + 40 bonus).

All players' scores are visible on the scoreboard throughout the game.

## Creating a Game

1. Click **New Game** on the home screen.
   - You need at least one valid deck (9 phrases) before you can create a game.
2. A game lobby is created with a unique **4-character code** (e.g., `B7KN`).
3. Share this code with the people you want to play with.
4. Once everyone has joined and selected a deck, the game owner starts the game.

## Joining a Game

1. On the home screen, click **Join Game**.
2. Enter the **4-character code** shared by the game owner.
3. You'll be taken to the game lobby where you can **select a deck** to play with.
4. Wait for the game owner to start the game.

If you don't have a valid deck yet, you'll be prompted to create one in **My Decks** first.

## In-Game Features

Once the game starts, you'll see three tabs:

### Game tab

Your 3×3 bingo card. Tap or click a cell to mark a phrase when you hear it. Marked cells are visually highlighted and can't be unmarked.

### Scoreboard tab

A live ranking of all players sorted by score (highest first). Your own entry is highlighted so you can quickly spot your position.

### Chat tab

Send messages to other players during the game. The chat also shows **system messages** — for example, when someone completes a combo:

> _"Alice completed combo "Corporate Classics" (+40 pts)"_

## Ending a Game

### For the game owner

- Click **End Game** to finish the round.
- Final scores are recorded to the leaderboard.
- Chat messages are deleted when the game ends.

### Leaving mid-game

- Any player can leave a game at any time.
- If the **owner leaves**, ownership transfers to another player in the game. If no other players remain, the game is deleted.

### Stale game cleanup

Games that sit idle are automatically cleaned up:

- Lobby games older than **1 hour** are removed.
- Active games older than **24 hours** are removed.

## Leaderboard

The leaderboard shows cumulative scores across all finished games. It displays:

- **Rank**
- **Username**
- **Total score** (sum of all game scores)
- **Games played**

The top 50 players are shown, sorted by total score. If you're not in the top 50, your own rank is always displayed at the bottom of the table so you can see where you stand.

## Admin Panel

Admins have access to a management panel at `/admin` where they can:

- **Manage phrases** — create, edit, and delete phrases (title, subtitle, base points)
- **Manage combos** — create, edit, and delete combos (name, bonus points, phrase selection)
- **Reset game data** — delete all games, player records, results, and chat messages (requires typing a confirmation word)

Deleting a phrase also removes it from any combos that reference it.
