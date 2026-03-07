<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { PinInput } from '$lib/components/ui/pin-input';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import SquarePlus from '@lucide/svelte/icons/square-plus';

	let { data } = $props();

	let pinValue = $state('');
	let error = $state('');
	let joinOpen = $state(false);

	const NO_DECK_MSG = 'You need a deck with 9 valid cards first. Create one in My Decks.';

	$effect(() => {
		if (page.url.searchParams.get('error') === 'no-deck') {
			toast.error(NO_DECK_MSG);
			history.replaceState(null, '', '/');
		}
	});

	function handleNewGame() {
		if (!data.hasValidDeck) {
			toast.error(NO_DECK_MSG);
			return;
		}
		goto('/game/new');
	}

	function handleJoinOpen() {
		if (!data.hasValidDeck) {
			toast.error(NO_DECK_MSG);
			return;
		}
		joinOpen = true;
	}

	async function handleJoin() {
		error = '';
		const code = pinValue.trim().toUpperCase();
		if (code.length < 4) {
			error = 'Please enter the full 4-character code.';
			return;
		}

		const res = await fetch(`/api/game/lookup?code=${encodeURIComponent(code)}`);
		if (res.ok) {
			const { gameId } = await res.json();
			joinOpen = false;
			goto(`/game/${gameId}`);
		} else {
			error = 'Game not found. Check the code and try again.';
		}
	}
</script>

<svelte:head>
	<title>Attention Bingo</title>
</svelte:head>
<div class="flex flex-col items-center gap-6 text-center">
	<h1
		class="text-4xl pt-8 pb-16 font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
	>
		It's Bingo Time!
	</h1>
</div>

<div class="flex flex-1 flex-col gap-6 items-center">
	<div class="flex flex-col gap-4 w-full text-center">
		<button type="button" class="w-full" onclick={handleJoinOpen}>
			<Card.Root class="hover:border-primary transition-colors cursor-pointer">
				<Card.Header>
					<UserPlus class="size-8 mx-auto text-primary mb-1" />
					<Card.Title>Join Game</Card.Title>
					<Card.Description>Join an existing game</Card.Description>
				</Card.Header>
			</Card.Root>
		</button>

		<button type="button" class="w-full" onclick={handleNewGame}>
			<Card.Root class="hover:border-primary transition-colors cursor-pointer">
				<Card.Header>
					<SquarePlus class="size-8 mx-auto text-primary mb-1" />
					<Card.Title>New Game</Card.Title>
					<Card.Description>Create a new game</Card.Description>
				</Card.Header>
			</Card.Root>
		</button>
	</div>
</div>

<Dialog.Root bind:open={joinOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Join Game</Dialog.Title>
			<Dialog.Description>Enter the game code to join.</Dialog.Description>
		</Dialog.Header>
		<div class="flex flex-col items-center gap-4">
			<PinInput
				bind:value={pinValue}
				maxlength={4}
				inputmode="text"
				onComplete={handleJoin}
				class="justify-center"
			/>
			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
			<Dialog.Footer class="w-full">
				<Button onclick={handleJoin} class="w-full">Join</Button>
			</Dialog.Footer>
		</div>
	</Dialog.Content>
</Dialog.Root>
