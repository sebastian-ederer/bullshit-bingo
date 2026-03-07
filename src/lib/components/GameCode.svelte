<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import Copy from '@lucide/svelte/icons/copy';
	import Share2 from '@lucide/svelte/icons/share-2';
	import Check from '@lucide/svelte/icons/check';

	let { code }: { code: string } = $props();

	let canShare = $state(false);
	let copied = $state(false);

	$effect(() => {
		canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
	});

	async function copyCode() {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(code);
			} else {
				// Fallback for insecure contexts / older browsers
				const textarea = document.createElement('textarea');
				textarea.value = code;
				textarea.style.position = 'fixed';
				textarea.style.opacity = '0';
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand('copy');
				document.body.removeChild(textarea);
			}
			copied = true;
			toast.success('Code copied!');
			setTimeout(() => (copied = false), 2000);
		} catch {
			toast.error('Could not copy code');
		}
	}

	async function shareCode() {
		try {
			await navigator.share({
				title: 'Attention Bingo',
				text: `Join my Bingo game! Code: ${code}`
			});
		} catch (e) {
			if ((e as DOMException).name !== 'AbortError') {
				await copyCode();
			}
		}
	}
</script>

<div class="flex flex-col items-center gap-2">
	<span class="text-sm text-muted-foreground">Share this code:</span>
	<button
		type="button"
		onclick={copyCode}
		class="cursor-pointer active:scale-95 transition-transform"
		title="Tap to copy"
	>
		<Badge variant="outline" class="text-3xl font-bold tracking-[0.2em] text-primary px-4 py-2">
			{code}
		</Badge>
	</button>
	<div class="flex gap-2 mt-1">
		<Button variant="outline" size="sm" onclick={copyCode}>
			{#if copied}
				<Check class="size-4 mr-1.5" />
				Copied
			{:else}
				<Copy class="size-4 mr-1.5" />
				Copy
			{/if}
		</Button>
		{#if canShare}
			<Button variant="outline" size="sm" onclick={shareCode}>
				<Share2 class="size-4 mr-1.5" />
				Share
			</Button>
		{/if}
	</div>
</div>
