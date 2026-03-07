<script lang="ts">
	type Props = {
		title: string;
		subtitle?: string | null;
		points?: number;
		marked?: boolean;
		disabled?: boolean;
		class?: string;
		onclick?: () => void;
	};

	let {
		title,
		subtitle,
		points,
		marked = false,
		disabled = false,
		class: className = '',
		onclick
	}: Props = $props();
</script>

<button
	type="button"
	class="aspect-square min-h-[80px] flex flex-col items-center justify-center text-center p-2 text-sm leading-tight break-words border-2 rounded-md transition-all gap-0.5
		{marked
		? 'bg-primary border-primary text-primary-foreground cursor-default'
		: 'bg-card border-border text-foreground hover:border-primary'}
		{disabled && !marked ? 'opacity-60 cursor-not-allowed' : ''}
		{!disabled && !marked ? 'cursor-pointer active:scale-95' : ''}
		{className}"
	{disabled}
	{onclick}
>
	<span class="font-medium">{title}</span>
	{#if subtitle}
		<span class="text-xs opacity-70 leading-tight">{subtitle}</span>
	{/if}
	{#if points}
		<span class="text-xs font-semibold {marked ? 'text-primary-foreground/70' : 'text-primary'}">{points} pts</span>
	{/if}
</button>
