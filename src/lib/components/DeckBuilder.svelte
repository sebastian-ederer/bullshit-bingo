<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import * as Carousel from '$lib/components/ui/carousel';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context';
	import BingoCell from './BingoCell.svelte';
	import type { PhraseData, ComboData } from '$lib/types';

	type Props = {
		phrases: PhraseData[];
		selectedIds: string[];
		combos: ComboData[];
		onselect: (ids: string[]) => void;
	};

	let { phrases, selectedIds, combos, onselect }: Props = $props();

	let sortedPhrases = $derived([...phrases].sort((a, b) => a.title.localeCompare(b.title)));
	let selectedSet = $derived(new Set(selectedIds));
	let phraseMap = $derived(new Map(phrases.map((p) => [p.id, p])));

	let api: CarouselAPI | undefined = $state();
	let activeTab = $state(0);
	let scrollPositions = [0, 0];

	function togglePhrase(id: string) {
		if (selectedSet.has(id)) {
			onselect(selectedIds.filter((sid) => sid !== id));
		} else if (selectedIds.length < 9) {
			onselect([...selectedIds, id]);
		}
	}

	function goToTab(index: number) {
		if (index === activeTab) return;
		api?.scrollTo(index);
	}

	$effect(() => {
		if (!api) return;

		function onSelect() {
			if (!api) return;
			const prev = activeTab;
			const next = api.selectedScrollSnap();
			if (prev !== next) {
				scrollPositions[prev] = window.scrollY;
				activeTab = next;
				requestAnimationFrame(() => {
					const target = scrollPositions[next];
					const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
					window.scrollTo(0, Math.min(target, Math.max(0, maxScroll)));
				});
			}
		}

		api.on('select', onSelect);
		return () => api?.off('select', onSelect);
	});
</script>

<div class="flex flex-col gap-4">
	<div class="font-semibold {selectedIds.length === 9 ? 'text-success' : 'text-muted-foreground'}">
		{selectedIds.length}/9 selected
	</div>

	<Carousel.Root opts={{ watchDrag: true, loop: false }} setApi={(a) => (api = a)} class="w-full">
		<Carousel.Content class="-ms-0">
			<!-- Phrases panel -->
			<Carousel.Item class="ps-0">
				<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 pb-10">
					{#each sortedPhrases as phrase (phrase.id)}
						<BingoCell
							title={phrase.title}
							subtitle={phrase.subtitle}
							points={phrase.basePoints}
							marked={selectedSet.has(phrase.id)}
							disabled={!selectedSet.has(phrase.id) && selectedIds.length >= 9}
							onclick={() => togglePhrase(phrase.id)}
						/>
					{/each}
				</div>
			</Carousel.Item>

			<!-- Combos panel -->
			<Carousel.Item class="ps-0">
				{#if combos.length === 0}
					<p class="text-muted-foreground italic text-center py-8">No combos available.</p>
				{:else}
					<div class="flex flex-col gap-2 pb-10">
						{#each combos as c (c.id)}
							{@const complete = c.phraseIds.every((pid) => selectedSet.has(pid))}
							{@const partial = !complete && c.phraseIds.some((pid) => selectedSet.has(pid))}
							<Card.Root
								class="transition-all
								{complete ? 'border-success bg-success/10 opacity-100' : ''}
								{partial ? 'border-primary opacity-75' : ''}
								{!complete && !partial ? 'opacity-50' : ''}"
							>
								<Card.Content class="p-3">
									<strong>{c.name}</strong>
									<Badge variant="secondary" class="ml-2">+{c.bonusPoints} pts</Badge>
									<div class="flex flex-wrap gap-1 mt-1">
										{#each c.phraseIds as pid (pid)}
											{@const phrase = phraseMap.get(pid)}
											{#if phrase}
												<Badge
													variant={selectedSet.has(pid) ? 'default' : 'outline'}
													class="text-xs"
												>
													{phrase.title}
												</Badge>
											{/if}
										{/each}
									</div>
								</Card.Content>
							</Card.Root>
						{/each}
					</div>
				{/if}
			</Carousel.Item>
		</Carousel.Content>
	</Carousel.Root>

	<!-- Tab indicator -->
	<div class="fixed inset-x-0 bottom-[60px] z-40 flex">
		{#each ['Phrases', 'Combos'] as label, i (label)}
			<button
				type="button"
				onclick={() => goToTab(i)}
				class="deck-tab flex-1 p-2 flex items-center justify-center gap-1.5 text-xs transition-all {activeTab ===
				i
					? 'deck-tab-active text-primary'
					: 'deck-tab-inactive text-muted-foreground'}"
			>
				<span
					class="size-2 rounded-full transition-colors {activeTab === i
						? 'bg-primary'
						: 'bg-muted-foreground/40'}"
				></span>
				{label}
			</button>
		{/each}
	</div>
</div>

<style>
	.deck-tab {
		backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
	}

	.deck-tab-active {
		background: oklch(0.2 0.05 278 / 0.55);
	}

	.deck-tab-inactive {
		background: oklch(0.15 0.03 278 / 0.35);
	}
</style>
