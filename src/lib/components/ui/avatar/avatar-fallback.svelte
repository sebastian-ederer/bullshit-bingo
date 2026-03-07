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
	data-slot="avatar-fallback"
	class={cn(
		"bg-muted flex size-full items-center justify-center rounded-full text-xs",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</span>
