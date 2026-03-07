<script lang="ts">
	import * as Card from '$lib/components/ui/card';

	let { players }: { players: { username: string }[] } = $props();
</script>

<Card.Root class="max-w-[300px] py-4 gap-2 mx-auto text-left">
	<Card.Header class="pb-0">
		<Card.Title class="text-base">Players ({players.length})</Card.Title>
	</Card.Header>
	<Card.Content class="px-4">
		<ul class="flex flex-col gap-1">
			{#each players as player (player.username)}
				<li class="px-3 py-2 bg-secondary rounded text-sm">{player.username}</li>
			{/each}
		</ul>
	</Card.Content>
</Card.Root>
