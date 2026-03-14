<script lang="ts">
	import { page } from '$app/state';
	import { headerBack } from '$lib/stores/headerBack.svelte';

	headerBack.value = { href: '/' };
</script>

<svelte:head>
	<title>Creating Game... - {page.data.appName}</title>
</svelte:head>

<p class="text-muted-foreground text-center py-12">Creating game...</p>
