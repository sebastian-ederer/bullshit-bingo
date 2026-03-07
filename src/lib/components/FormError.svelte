<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import * as Alert from '$lib/components/ui/alert';

	let { error }: { error: string | undefined | null } = $props();
</script>

{#if error}
	<Alert.Root variant="destructive" class="mb-4">
		<CircleAlert />
		<Alert.Title>Error</Alert.Title>
		<Alert.Description>{error}</Alert.Description>
	</Alert.Root>
{/if}
