<script lang="ts">
	import BingoCell from './BingoCell.svelte';

	type Props = {
		phrases: { id: string; text: string; subtitle?: string | null; points?: number }[];
		marks: number[];
		disabled?: boolean;
		onmark?: (index: number) => void;
	};

	let { phrases, marks, disabled = false, onmark }: Props = $props();

	let markSet = $derived(new Set(marks));
</script>

<div class="grid grid-cols-3 gap-1.5 w-full">
	{#each phrases as phrase, i (phrase.id)}
		{@const marked = markSet.has(i)}
		<BingoCell
			title={phrase.text}
			subtitle={phrase.subtitle}
			points={phrase.points}
			{marked}
			disabled={disabled || marked}
			onclick={() => onmark?.(i)}
		/>
	{/each}
</div>
