<script lang="ts">
	import { enhance } from '$app/forms';
	import { SvelteMap } from 'svelte/reactivity';
	import { connectToGame } from '$lib/game-events';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import * as Table from '$lib/components/ui/table';
	import ConfirmDeleteDialog from '$lib/components/ConfirmDeleteDialog.svelte';
	import FormError from '$lib/components/FormError.svelte';
	import { headerBack } from '$lib/stores/headerBack.svelte';
	import { displayName } from '$lib/types';
	import { useSubmitting } from '$lib/stores/submitting.svelte';

	headerBack.value = { href: '/admin/games' };

	let { data, form } = $props();

	let ssePlayers: typeof data.players = $state([]);
	let sseScores = new SvelteMap<string, number>();
	let sseStatus: string | null = $state(null);

	let players = $derived.by(() => {
		const serverNames = new Set(data.players.map((p) => displayName(p)));
		const extra = ssePlayers.filter((p) => !serverNames.has(displayName(p)));
		const merged = [...data.players, ...extra];
		for (const p of merged) {
			const override = sseScores.get(displayName(p));
			if (override !== undefined) p.score = override;
		}
		return merged;
	});

	let sortedPlayers = $derived([...players].sort((a, b) => b.score - a.score));

	let deleteFormEl: HTMLFormElement | undefined = $state();
	let status = $derived(sseStatus ?? data.game.status);
	const endGame = useSubmitting();

	$effect(() => {
		const connection = connectToGame(data.game.id, {
			player_joined(evt) {
				if (!players.some((p) => displayName(p) === evt.username)) {
					ssePlayers = [
						...ssePlayers,
						{
							id: crypto.randomUUID(),
							userId: '',
							username: evt.username,
							name: evt.username,
							score: 0
						}
					];
				}
			},
			score_update(evt) {
				for (const s of evt.scores) {
					sseScores.set(s.username, s.score);
				}
			},
			game_started() {
				sseStatus = 'active';
			},
			game_ended() {
				sseStatus = 'finished';
			}
		});

		return () => connection.close();
	});
</script>

<svelte:head>
	<title>{data.game.name} - Admin</title>
</svelte:head>

<div>
	<div class="flex items-center gap-4 mb-6">
		<h1 class="text-2xl font-bold text-primary">{data.game.code}</h1>
		<Badge
			variant={status === 'active' ? 'default' : status === 'finished' ? 'secondary' : 'outline'}
			class={status === 'active' ? 'bg-success text-success-foreground' : ''}
		>
			{status}
		</Badge>
	</div>

	<FormError error={form?.error} />

	<section class="mb-8">
		<h2 class="text-lg font-semibold mb-4">Game Controls</h2>
		<div class="flex gap-3 flex-wrap">
			{#if status === 'active'}
				<form method="POST" action="?/end" use:enhance={endGame.enhance} class="contents">
					<SubmitButton class="bg-amber-600 hover:bg-amber-700 text-white" submitting={endGame.submitting}>End Game</SubmitButton>
				</form>
			{/if}
			<form method="POST" action="?/delete" use:enhance bind:this={deleteFormEl} class="contents">
				<ConfirmDeleteDialog
					title="Delete Game"
					description="Are you sure you want to delete this game? This action cannot be undone."
					onconfirm={() => deleteFormEl?.requestSubmit()}
				>
					{#snippet trigger(props)}
						<Button {...props} variant="destructive">Delete Game</Button>
					{/snippet}
				</ConfirmDeleteDialog>
			</form>
		</div>
	</section>

	<section>
		<h2 class="text-lg font-semibold mb-4">Players ({players.length})</h2>
		{#if players.length === 0}
			<p class="text-muted-foreground italic">No players have joined yet.</p>
		{:else}
			<div class="max-w-[400px]">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Player</Table.Head>
							<Table.Head>Score</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each sortedPlayers as player (player.id)}
							<Table.Row>
								<Table.Cell>{displayName(player)}</Table.Cell>
								<Table.Cell>{player.score}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	</section>
</div>
