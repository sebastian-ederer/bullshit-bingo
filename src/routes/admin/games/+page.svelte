<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import { headerBack } from '$lib/stores/headerBack.svelte';
	import { useSubmitting } from '$lib/stores/submitting.svelte';

	headerBack.value = { href: '/profile' };

	let { data, form } = $props();

	$effect(() => {
		if (form?.resetSuccess) toast.success('All game data has been reset.');
		if (form?.error) toast.error(form.error);
	});

	type Game = (typeof data.games)[number];

	let extraGames = $state<Game[]>([]);
	let cursorOverride = $state<string | null | undefined>(undefined);
	let nextCursor = $derived(cursorOverride !== undefined ? cursorOverride : data.nextCursor);
	let loading = $state(false);
	let confirmText = $state('');
	const reset = useSubmitting();

	let allGames = $derived([...data.games, ...extraGames]);

	async function loadMore() {
		if (loading || !nextCursor) return;
		loading = true;
		try {
			const res = await fetch(`/api/admin/games?cursor=${encodeURIComponent(nextCursor)}`);
			if (res.ok) {
				const page = await res.json();
				extraGames = [...extraGames, ...page.games];
				cursorOverride = page.nextCursor;
			}
		} finally {
			loading = false;
		}
	}

	function handleWindowScroll() {
		if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 300) {
			loadMore();
		}
	}

	$effect(() => {
		window.addEventListener('scroll', handleWindowScroll);
		return () => window.removeEventListener('scroll', handleWindowScroll);
	});
</script>

<svelte:head>
	<title>Games - Admin</title>
</svelte:head>

<div>
	<h1 class="text-2xl font-bold mb-4">Game Sessions</h1>

	<Tabs.Root value="games">
		<Tabs.List class="w-full">
			<Tabs.Trigger value="games">Games</Tabs.Trigger>
			<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="games">
			{#if allGames.length === 0}
				<p class="text-muted-foreground italic text-center mt-4">No games yet.</p>
			{:else}
				<div class="flex flex-col gap-3 mt-4">
					{#each allGames as game (game.id)}
						<a href="/admin/games/{game.id}" class="block no-underline">
							<Card.Root class="hover:border-primary transition-colors">
								<Card.Content>
									<div class="flex justify-between items-center mb-2">
										<h3 class="text-base font-semibold">{game.code}</h3>
										<Badge
											variant={game.status === 'active'
												? 'default'
												: game.status === 'finished'
													? 'secondary'
													: 'outline'}
											class={game.status === 'active' ? 'bg-success text-success-foreground' : ''}
										>
											{game.status}
										</Badge>
									</div>
									<div class="flex flex-col gap-1 text-sm text-muted-foreground flex-wrap">
										<span>{game.playerCount} players</span>
										{#if game.status === 'finished' && game.finishedAt}
											<span
												>{new Date(game.finishedAt).toLocaleDateString('en-GB', {
													day: 'numeric',
													month: 'short',
													year: 'numeric'
												})}, {new Date(game.finishedAt).toLocaleTimeString('en-GB', {
													hour: '2-digit',
													minute: '2-digit'
												})}</span
											>
										{/if}
									</div>
								</Card.Content>
							</Card.Root>
						</a>
					{/each}
				</div>
				{#if loading}
					<p class="text-center text-sm text-muted-foreground py-4">Loading...</p>
				{/if}
			{/if}
		</Tabs.Content>

		<Tabs.Content value="settings">
			<section class="mt-4">
				<h2 class="text-lg font-semibold text-destructive mb-2">Danger Zone</h2>
				<p class="text-sm text-muted-foreground mb-4">
					Reset all game data. Deletes all games, players, chat messages, and leaderboard results.
					Phrases, decks, and combos are preserved.
				</p>
				<form method="POST" action="?/reset" use:enhance={reset.enhance} class="flex flex-col gap-3 max-w-[400px]">
					<div class="flex flex-col gap-1.5">
						<Label>Type <strong>RESET</strong> to confirm</Label>
						<Input type="text" name="confirmation" bind:value={confirmText} placeholder="RESET" />
					</div>
					<SubmitButton variant="destructive" submitting={reset.submitting} disabled={confirmText !== 'RESET'}>
						Reset All Game Data
					</SubmitButton>
				</form>
			</section>
		</Tabs.Content>
	</Tabs.Root>
</div>
