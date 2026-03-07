<script lang="ts">
	import { Button, type ButtonProps } from '$lib/components/ui/button';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import type { Snippet } from 'svelte';

	let {
		submitting = false,
		iconOnly = false,
		children,
		...restProps
	}: ButtonProps & { submitting?: boolean; iconOnly?: boolean; children?: Snippet } = $props();
</script>

<Button type="submit" disabled={submitting || restProps.disabled} {...restProps}>
	{#if submitting && iconOnly}
		<LoaderCircle class="size-4 animate-spin" />
	{:else if submitting}
		<LoaderCircle class="size-4 animate-spin" />
		{@render children?.()}
	{:else}
		{@render children?.()}
	{/if}
</Button>
