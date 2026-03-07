<script lang="ts">
	import GameCode from '$lib/components/GameCode.svelte';
	import PlayerList from '$lib/components/PlayerList.svelte';

	type Props = {
		code: string;
		players: { username: string }[];
	};

	let { code, players }: Props = $props();
</script>

<div class="text-center py-8">
	<p class="text-muted-foreground mb-8">Waiting for the game to start...</p>

	<div class="mb-8">
		<GameCode {code} />
	</div>

	<PlayerList {players} />
</div>
