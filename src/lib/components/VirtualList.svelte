<script lang="ts" generics="T">
	import { tick, onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

	type Props = {
		items: T[];
		estimatedHeight?: number;
		overscan?: number;
		children: import('svelte').Snippet<[T, number]>;
		containerClass?: string;
		scrollToEnd?: boolean;
		scrollToIndex?: number;
		onscroll?: (e: Event) => void;
	};

	let {
		items,
		estimatedHeight = 48,
		overscan = 10,
		children,
		containerClass = '',
		scrollToEnd = false,
		scrollToIndex,
		onscroll: onscrollProp
	}: Props = $props();

	let viewport: HTMLDivElement | undefined = $state();
	let heightCache = new SvelteMap<number, number>();
	let startIndex = $state(0);
	let endIndex = $state(0);
	let topPad = $state(0);
	let bottomPad = $state(0);
	let prevItemCount = 0;
	let wasAtBottom = true;

	function getHeight(index: number): number {
		return heightCache.get(index) ?? estimatedHeight;
	}

	function getTotalHeight(): number {
		let total = 0;
		for (let i = 0; i < items.length; i++) {
			total += getHeight(i);
		}
		return total;
	}

	function getOffsetTop(index: number): number {
		let offset = 0;
		for (let i = 0; i < index; i++) {
			offset += getHeight(i);
		}
		return offset;
	}

	function computeWindow() {
		if (!viewport) return;
		const scrollTop = viewport.scrollTop;
		const viewportHeight = viewport.clientHeight;

		let accumulated = 0;
		let newStart = 0;
		for (let i = 0; i < items.length; i++) {
			if (accumulated + getHeight(i) > scrollTop) {
				newStart = i;
				break;
			}
			accumulated += getHeight(i);
		}

		let newEnd = newStart;
		let visible = accumulated - scrollTop;
		for (let i = newStart; i < items.length; i++) {
			newEnd = i;
			visible += getHeight(i);
			if (visible >= viewportHeight) break;
		}

		startIndex = Math.max(0, newStart - overscan);
		endIndex = Math.min(items.length - 1, newEnd + overscan);
		topPad = getOffsetTop(startIndex);
		bottomPad = Math.max(0, getTotalHeight() - getOffsetTop(endIndex + 1));
	}

	function measureItems() {
		if (!viewport) return;
		const content = viewport.querySelector('[data-virtual-content]');
		if (!content) return;

		const children_els = content.querySelectorAll('[data-virtual-item]');
		let changed = false;
		children_els.forEach((el) => {
			const idx = Number(el.getAttribute('data-virtual-item'));
			const h = el.getBoundingClientRect().height;
			if (!isNaN(idx) && h > 0 && heightCache.get(idx) !== h) {
				heightCache.set(idx, h);
				changed = true;
			}
		});
		if (changed) computeWindow();
	}

	function handleScroll(e: Event) {
		if (!viewport) return;
		wasAtBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 16;
		computeWindow();
		tick().then(measureItems);
		onscrollProp?.(e);
	}

	$effect(() => {
		// Re-run when items change
		items.length;
		const shouldScrollToEnd = scrollToEnd && (wasAtBottom || items.length > prevItemCount);
		prevItemCount = items.length;

		// Reset cache for indices that no longer exist
		for (const key of heightCache.keys()) {
			if (key >= items.length) heightCache.delete(key);
		}

		computeWindow();
		tick().then(() => {
			measureItems();
			if (shouldScrollToEnd && viewport) {
				viewport.scrollTop = viewport.scrollHeight;
			}
		});
	});

	onMount(() => {
		computeWindow();
		tick().then(() => {
			measureItems();
			if (scrollToIndex != null && scrollToIndex >= 0 && viewport) {
				viewport.scrollTop = getOffsetTop(scrollToIndex);
			} else if (scrollToEnd && viewport) {
				viewport.scrollTop = viewport.scrollHeight;
			}
		});
	});

	let visibleItems = $derived(items.slice(startIndex, endIndex + 1));
</script>

<div bind:this={viewport} class={containerClass} onscroll={handleScroll}>
	<div style="height: {topPad}px"></div>
	<div data-virtual-content>
		{#each visibleItems as item, i (startIndex + i)}
			<div data-virtual-item={startIndex + i}>
				{@render children(item, startIndex + i)}
			</div>
		{/each}
	</div>
	<div style="height: {bottomPad}px"></div>
</div>
