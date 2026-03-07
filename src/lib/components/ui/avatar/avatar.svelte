<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLSpanElement> & { children?: import("svelte").Snippet } = $props();
</script>

<span
	data-slot="avatar"
	class={cn(
		"relative flex size-8 shrink-0 overflow-hidden rounded-full",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</span>
