<script lang="ts">
	import * as Card from '$lib/components/ui/card';

	type Props = {
		scores: { username: string; score: number; isMe?: boolean }[];
	};

	let { scores }: Props = $props();

	let sorted = $derived([...scores].sort((a, b) => b.score - a.score));
</script>

<Card.Root class="gap-2 py-4">
	<Card.Header class="pb-0">
		<Card.Title class="text-base">Scoreboard</Card.Title>
	</Card.Header>
	<Card.Content>
		{#if sorted.length === 0}
			<p class="text-sm text-muted-foreground">No players yet</p>
		{:else}
			<ol class="flex flex-col gap-1">
				{#each sorted as entry, i (entry.username)}
					<li
						class="flex items-center gap-2 px-2 py-1.5 rounded text-sm {entry.isMe
							? 'bg-primary/10'
							: ''}"
					>
						<span class="text-xs text-muted-foreground w-8">#{i + 1}</span>
						<span class="flex-1">{entry.username}</span>
						<span class="font-bold text-primary">{entry.score}</span>
					</li>
				{/each}
			</ol>
		{/if}
	</Card.Content>
</Card.Root>
