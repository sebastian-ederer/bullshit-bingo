<script lang="ts">
	import { PinInput as PinInputPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
		maxlength = 4,
		onComplete,
		...restProps
	}: Omit<PinInputPrimitive.RootProps, 'children'> & {
		onComplete?: (value: string) => void;
	} = $props();
</script>

<PinInputPrimitive.Root
	bind:ref
	bind:value
	onComplete={() => onComplete?.(value)}
	{maxlength}
	textalign="center"
	data-slot="pin-input"
	class={cn('flex items-center gap-2', className)}
	{...restProps}
>
	{#snippet children({ cells })}
		{#each cells as cell (cell)}
			<PinInputPrimitive.Cell
				{cell}
				class="border-input text-foreground relative flex h-12 w-12 items-center justify-center rounded-md border bg-transparent text-lg font-semibold uppercase transition-all data-[active]:border-ring data-[active]:ring-ring/50 data-[active]:ring-[3px]"
			>
				{#if cell.char !== null}
					<span>{cell.char}</span>
				{/if}
				{#if cell.hasFakeCaret}
					<span class="pointer-events-none absolute inset-0 flex items-center justify-center">
						<span class="h-5 w-px animate-pulse bg-foreground"></span>
					</span>
				{/if}
			</PinInputPrimitive.Cell>
		{/each}
	{/snippet}
</PinInputPrimitive.Root>
