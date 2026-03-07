<script lang="ts">
	import { headerBack } from '$lib/stores/headerBack.svelte';

	headerBack.value = { href: '/' };
</script>

<svelte:head>
	<title>Creating Game... - Attention Bingo</title>
</svelte:head>

<p class="text-muted-foreground text-center py-12">Creating game...</p>
