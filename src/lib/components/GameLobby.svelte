<script lang="ts">
	import GameCode from '$lib/components/GameCode.svelte';
	import PlayerList from '$lib/components/PlayerList.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		code: string;
		players: { username: string }[];
		actions?: Snippet;
	};

	let { code, players, actions }: Props = $props();
</script>

<div class="text-center py-8">
	<p class="text-muted-foreground mb-8">Waiting for the game to start...</p>

	<div class="mb-8">
		<GameCode {code} />
	</div>

	{#if actions}
		<div class="mb-8">
			{@render actions()}
		</div>
	{/if}

	<PlayerList {players} />
</div>
