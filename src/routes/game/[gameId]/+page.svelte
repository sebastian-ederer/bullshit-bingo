<script lang="ts">
	import { beforeNavigate, invalidateAll, goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import BingoCard from '$lib/components/BingoCard.svelte';
	import Scoreboard from '$lib/components/Scoreboard.svelte';
	import ChatPanel from '$lib/components/ChatPanel.svelte';
	import GameLobby from '$lib/components/GameLobby.svelte';
	import GameCode from '$lib/components/GameCode.svelte';
	import PlayerList from '$lib/components/PlayerList.svelte';
	import { connectToGame } from '$lib/game-events';
	import { activeGame } from '$lib/stores/activeGame.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as Alert from '$lib/components/ui/alert';
	import * as Select from '$lib/components/ui/select';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import FormError from '$lib/components/FormError.svelte';
	import Confetti from '$lib/components/Confetti.svelte';
	import { useSubmitting } from '$lib/stores/submitting.svelte';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';

	let { data, form } = $props();
	let canControl = $derived(data.isOwner || data.isAdmin);
	let lobbyPlayers = $derived.by(() => {
		const playerList = scores.map((s) => ({ username: s.username }));
		const ownerInList = playerList.some((p) => p.username === data.ownerUsername);
		return ownerInList ? playerList : [{ username: data.ownerUsername }, ...playerList];
	});

	let marks = $state<number[]>([]);
	let scores = $state<{ username: string; score: number; isMe?: boolean }[]>([]);
	let messages = $state<
		{ userId?: string; username: string; message: string; timestamp: number }[]
	>([]);
	let gameStatus = $state('');
	let joined = $state(false);
	let joining = $state(false);
	let selectedDeckId = $state('');
	let keyboardOpen = $state(false);
	const startGame = useSubmitting();
	const endGame = useSubmitting();
	const restartGameSubmit = useSubmitting();

	$effect(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		const onResize = () => {
			keyboardOpen = vv.height < window.innerHeight * 0.75;
		};
		vv.addEventListener('resize', onResize);
		return () => vv.removeEventListener('resize', onResize);
	});

	$effect(() => {
		marks = data.player?.marks ?? [];
		scores = data.players;
		messages = data.messages;
		gameStatus = data.game.status;
		joined = !!data.player;
		activeGame.active = joined && gameStatus === 'active';
		activeGame.totalMessages = data.messages.length;
		activeGame.lastReadCount = data.messages.length;
	});

	$effect(() => {
		activeGame.totalMessages = messages.length;
	});

	$effect(() => {
		if (activeGame.tab === 'chat') {
			activeGame.markAllRead();
		}
	});

	function mergeScores(incoming: { username: string; score: number }[]) {
		const meSet = new Set(scores.filter((s) => s.isMe).map((s) => s.username));
		return incoming.map((s) => ({ ...s, isMe: meSet.has(s.username) }));
	}

	let connection: { close: () => void } | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	function debouncedInvalidate() {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => invalidateAll(), 300);
	}

	function setupSSE() {
		if (connection) connection.close();
		connection = connectToGame(data.game.id, {
			player_joined() {
				debouncedInvalidate();
			},
			player_left() {
				debouncedInvalidate();
			},
			game_started() {
				gameStatus = 'active';
				debouncedInvalidate();
			},
			chat(d) {
				messages = [...messages, d];
			},
			score_update(d) {
				scores = mergeScores(d.scores);
			},
			game_ended(d) {
				gameStatus = 'finished';
				scores = mergeScores(d.finalScores);
				activeGame.active = false;
				debouncedInvalidate();
			},
			game_restarted() {
				gameStatus = 'lobby';
				activeGame.active = false;
				activeGame.tab = 'game';
				debouncedInvalidate();
			}
		});
	}

	function shouldAbandon(): boolean {
		return data.isOwner && gameStatus !== 'finished';
	}

	function abandonGame() {
		navigator.sendBeacon(`/api/game/${data.game.id}/abandon`);
	}

	beforeNavigate((navigation) => {
		if (navigation.type !== 'leave' && shouldAbandon()) abandonGame();
	});

	$effect(() => {
		if (joined || canControl) {
			setupSSE();
		}
		return () => {
			connection?.close();
			if (debounceTimer) clearTimeout(debounceTimer);
			activeGame.active = false;
			activeGame.tab = 'game';
		};
	});

	async function joinGame() {
		if (!selectedDeckId) return;
		joining = true;
		try {
			const res = await fetch(`/api/game/${data.game.id}/join`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ deckId: selectedDeckId })
			});
			if (res.ok) {
				joined = true;
				await invalidateAll();
				setupSSE();
			}
		} finally {
			joining = false;
		}
	}

	let leaving = $state(false);

	async function leaveGame() {
		leaving = true;
		try {
			const res = await fetch(`/api/game/${data.game.id}/leave`, { method: 'POST' });
			if (res.ok) goto('/');
		} finally {
			leaving = false;
		}
	}

	async function markCell(index: number) {
		const res = await fetch(`/api/game/${data.game.id}/mark`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ cellIndex: index })
		});
		if (res.ok) {
			const result = await res.json();
			marks = result.marks;
		}
	}

	async function sendChat(message: string) {
		await fetch(`/api/game/${data.game.id}/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message })
		});
	}
</script>

<svelte:head>
	<title>{data.game.name} - Attention Bingo</title>
</svelte:head>

<div class="relative flex-1 flex flex-col">
	<FormError error={form?.error} />

	{#if joined && gameStatus !== 'finished' && activeGame.tab !== 'chat'}
		<div class="sticky top-0 z-10 flex justify-end gap-2 mb-4 py-2">
			{#if canControl && gameStatus === 'active'}
				<form method="POST" action="?/end" use:enhance={endGame.enhance}>
					<Button type="submit" variant="outline" size="sm" disabled={endGame.submitting}
						>End Game</Button
					>
				</form>
			{/if}
			<Button variant="outline" size="sm" onclick={leaveGame} disabled={leaving}>
				{leaving ? 'Leaving...' : 'Leave Game'}
			</Button>
		</div>
	{/if}

	{#if !joined}
		<div class="text-center py-12">
			<div class="mb-6">
				<GameCode code={data.game.code} />
			</div>

			{#if data.userDecks.length === 0}
				<Alert.Root variant="destructive" class="max-w-[300px] mx-auto mb-4 text-left">
					<CircleAlert />
					<Alert.Title>No decks available</Alert.Title>
					<Alert.Description>You need a deck with 9 valid cards to play.</Alert.Description>
				</Alert.Root>
				<Button href="/decks/new" class="mb-6">Create a Deck</Button>
			{:else}
				<div class="max-w-[300px] mx-auto mb-4">
					<Label class="text-sm text-muted-foreground">Select your deck</Label>
					<Select.Root type="single" bind:value={selectedDeckId}>
						<Select.Trigger class="w-full mt-1.5">
							{data.userDecks.find((d) => d.id === selectedDeckId)?.name ?? 'Choose a deck...'}
						</Select.Trigger>
						<Select.Content>
							{#each data.userDecks as deck (deck.id)}
								<Select.Item value={deck.id} disabled={deck.validPhraseCount !== 9}>
									{deck.name}{deck.validPhraseCount !== 9
										? ` (${deck.validPhraseCount}/9 cards)`
										: ''}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				{#if data.isOwner}
					<form method="POST" action="?/start" use:enhance={startGame.enhance} class="mb-6">
						<input type="hidden" name="deckId" value={selectedDeckId} />
						<Button type="submit" size="lg" disabled={!selectedDeckId || startGame.submitting}
							>Start Game</Button
						>
					</form>
				{:else}
					<Button onclick={joinGame} disabled={joining || !selectedDeckId} size="lg" class="mb-6">
						{joining ? 'Joining...' : 'Join Game'}
					</Button>
				{/if}
			{/if}

			{#if data.isOwner}
				<PlayerList players={lobbyPlayers} />
			{/if}
		</div>
	{:else if gameStatus === 'lobby'}
		<GameLobby code={data.game.code} players={lobbyPlayers}>
			{#snippet actions()}
				{#if canControl}
					<form method="POST" action="?/start" use:enhance={startGame.enhance}>
						<Button type="submit" size="lg" disabled={startGame.submitting}>Start Game</Button>
					</form>
				{/if}
			{/snippet}
		</GameLobby>
	{:else if gameStatus === 'active'}
		{#if activeGame.tab === 'game'}
			<div class="flex-1 flex items-center justify-center">
				<BingoCard
					phrases={data.cardPhrases.map((p) => ({
						id: p.id,
						text: p.title,
						subtitle: p.subtitle,
						points: p.basePoints
					}))}
					{marks}
					onmark={markCell}
				/>
			</div>
		{:else if activeGame.tab === 'scoreboard'}
			<div class="flex-1 flex flex-col min-h-0">
				<Scoreboard {scores} />
			</div>
		{:else if activeGame.tab === 'chat'}
			<div
				class="fixed inset-x-0 z-10"
				style="top: calc(3rem + env(safe-area-inset-top)); bottom: {keyboardOpen
					? '0px'
					: 'calc(60px + env(safe-area-inset-bottom))'}"
			>
				<div class="mx-auto max-w-[960px] h-full flex flex-col px-4">
					<ChatPanel
						{messages}
						onsend={sendChat}
						currentUserId={data.user?.id}
						firstUnreadIndex={activeGame.firstUnreadIndex}
					/>
				</div>
			</div>
		{/if}
	{:else if gameStatus === 'finished'}
		<Confetti />
		<div
			class="fixed inset-0 bg-background/95 z-[200] flex justify-center overflow-y-auto animate-in fade-in"
		>
			<div class="text-center max-w-[500px] w-full p-8 my-auto">
				<h1 class="text-4xl font-bold mb-8">Game Over!</h1>
				<div class="flex gap-3 justify-center mb-8">
					<Button href="/" size="lg">Back to Home</Button>
					{#if data.dev && canControl}
						<form method="POST" action="?/restart" use:enhance={restartGameSubmit.enhance}>
							<Button
								type="submit"
								variant="outline"
								size="lg"
								disabled={restartGameSubmit.submitting}
							>
								<RotateCcw class="size-4" />
								Restart
							</Button>
						</form>
					{/if}
				</div>
				<div class="max-w-[400px] mx-auto">
					<Scoreboard {scores} />
				</div>
			</div>
		</div>
	{/if}
</div>
