<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { headerBack } from '$lib/stores/headerBack.svelte';

	headerBack.value = { href: '/' };

	let { data } = $props();
</script>

<svelte:head>
	<title>Leaderboard - {data.appName}</title>
</svelte:head>

<div>
	<h1 class="text-2xl font-bold mb-6">Global Leaderboard</h1>

	{#if data.leaderboard.length === 0 && !data.currentUserEntry}
		<p class="text-muted-foreground italic mt-4 text-center">
			No completed games yet. Play some games to see the leaderboard!
		</p>
	{:else}
		<div class="max-w-[600px]">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-[50px] text-center">#</Table.Head>
						<Table.Head>Player</Table.Head>
						<Table.Head>Total Score</Table.Head>
						<Table.Head>Games</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.leaderboard as entry, i (entry.userId)}
						<Table.Row
							class="{i < 3 ? 'font-semibold' : ''} {entry.userId === data.currentUserId ? 'bg-muted/50' : ''}"
						>
							<Table.Cell class="text-center">
								{#if i < 3}
									<Badge
										variant={i === 0 ? 'default' : 'secondary'}
										class={i === 0 ? 'bg-yellow-500 text-black' : ''}
									>
										{i + 1}
									</Badge>
								{:else}
									{i + 1}
								{/if}
							</Table.Cell>
							<Table.Cell>{entry.username}</Table.Cell>
							<Table.Cell class="text-primary font-semibold">{entry.totalScore}</Table.Cell>
							<Table.Cell>{entry.gamesPlayed}</Table.Cell>
						</Table.Row>
					{/each}
					{#if data.currentUserEntry}
						<Table.Row class="border-t-2 border-dashed bg-muted/50">
							<Table.Cell class="text-center text-muted-foreground">
								{data.currentUserEntry.rank}
							</Table.Cell>
							<Table.Cell>{data.currentUserEntry.username}</Table.Cell>
							<Table.Cell class="text-primary font-semibold"
								>{data.currentUserEntry.totalScore}</Table.Cell
							>
							<Table.Cell>{data.currentUserEntry.gamesPlayed}</Table.Cell>
						</Table.Row>
					{/if}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
