<script lang="ts">
	import { enhance } from '$app/forms';
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Check from '@lucide/svelte/icons/check';
	import ConfirmDeleteDialog from '$lib/components/ConfirmDeleteDialog.svelte';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import type { PhraseData, ComboData } from '$lib/types';
	import { useSubmitting } from '$lib/stores/submitting.svelte';

	type Props = {
		phrases: PhraseData[];
		combos: ComboData[];
	};

	let { phrases, combos }: Props = $props();

	let step = $state<'list' | 'builder'>('list');
	let editingComboId = $state<string | null>(null);
	let deleteComboFormEls: Record<string, HTMLFormElement> = $state({});

	let comboName = $state('');
	let comboBonusPoints = $state('25');

	const flipDurationMs = 150;

	let comboItems = $state<PhraseData[]>([]);
	let poolItems = $state<PhraseData[]>([]);

	let phraseMap = $derived(new Map(phrases.map((p) => [p.id, p])));

	$effect(() => {
		if (step !== 'builder') return;
		const comboIds = new Set(comboItems.map((i) => i.id));
		poolItems = phrases.filter((p) => !comboIds.has(p.id)).map((p) => ({ ...p }));
	});

	function openNewCombo() {
		editingComboId = null;
		comboName = '';
		comboBonusPoints = '25';
		comboItems = [];
		step = 'builder';
	}

	function openEditCombo(c: ComboData) {
		editingComboId = c.id;
		comboName = c.name;
		comboBonusPoints = String(c.bonusPoints);
		comboItems = c.phraseIds
			.map((pid) => phraseMap.get(pid))
			.filter((p): p is PhraseData => !!p)
			.map((p) => ({ ...p }));
		step = 'builder';
	}

	function goBack() {
		step = 'list';
		editingComboId = null;
		comboName = '';
		comboBonusPoints = '25';
		comboItems = [];
	}

	function handlePoolDnd(e: CustomEvent<{ items: PhraseData[] }>) {
		poolItems = e.detail.items;
	}
	function handleComboDnd(e: CustomEvent<{ items: PhraseData[] }>) {
		comboItems = e.detail.items;
	}

	function addToCombo(phrase: PhraseData) {
		if (!comboItems.some((i) => i.id === phrase.id)) {
			comboItems = [...comboItems, { ...phrase }];
			poolItems = poolItems.filter((i) => i.id !== phrase.id);
		}
	}

	function removeFromCombo(phrase: PhraseData) {
		const removed = comboItems.find((i) => i.id === phrase.id);
		comboItems = comboItems.filter((i) => i.id !== phrase.id);
		if (removed) poolItems = [...poolItems, removed];
	}

	const save = useSubmitting(() => {
		return async ({ update }) => {
			goBack();
			await update();
		};
	});
</script>

<section class="mt-4">
	{#if step === 'list'}
		<!-- Step 1: Combo list -->
		{#if phrases.length >= 2}
			<Button onclick={openNewCombo} class="mb-4">
				<Plus class="size-4 mr-2" />
				New Combo
			</Button>
		{:else}
			<p class="text-muted-foreground italic">Add at least 2 phrases to create combos.</p>
		{/if}

		{#if combos.length === 0}
			<p class="text-muted-foreground italic text-center mt-4">No combos yet.</p>
		{:else}
			<div class="flex flex-col gap-2">
				{#each combos as c (c.id)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						onclick={() => openEditCombo(c)}
						onkeydown={(e) => { if (e.key === 'Enter') openEditCombo(c); }}
						role="button"
						tabindex="0"
					>
						<Card.Root
							class="flex flex-row items-center justify-between px-4 py-3 hover:bg-accent transition-colors cursor-pointer"
						>
							<div class="flex flex-col gap-1">
								<div class="flex items-center gap-2">
									<strong class="text-sm">{c.name}</strong>
									<Badge variant="secondary" class="text-[0.65rem]">+{c.bonusPoints} pts</Badge>
								</div>
								<div class="flex flex-wrap gap-1">
									{#each c.phraseIds as pid (pid)}
										{@const phrase = phraseMap.get(pid)}
										{#if phrase}
											<Badge variant="outline" class="text-[0.6rem]">{phrase.title}</Badge>
										{/if}
									{/each}
								</div>
							</div>
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="flex items-center"
								onclick={(e) => e.stopPropagation()}
								onkeydown={(e) => { if (e.key === 'Enter') e.stopPropagation(); }}
							>
								<form
									method="POST"
									action="?/deleteCombo"
									use:enhance
									bind:this={deleteComboFormEls[c.id]}
									class="contents"
								>
									<input type="hidden" name="comboId" value={c.id} />
									<ConfirmDeleteDialog
										title="Delete Combo"
										description={'Are you sure you want to delete "' +
											c.name +
											'"? This action cannot be undone.'}
										onconfirm={() => deleteComboFormEls[c.id]?.requestSubmit()}
									>
										{#snippet trigger(props)}
											<Button {...props} variant="outline" size="icon-sm">
												<Trash2 class="size-4" />
											</Button>
										{/snippet}
									</ConfirmDeleteDialog>
								</form>
							</div>
						</Card.Root>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Step 2: Combo builder -->
		<div class="flex items-center gap-2 mb-4">
			<Button variant="outline" size="icon-sm" onclick={goBack} title="Back">
				<ArrowLeft class="size-4" />
			</Button>
			<h2 class="text-lg font-semibold">{editingComboId ? 'Edit Combo' : 'New Combo'}</h2>
		</div>

		<form
			method="POST"
			action={editingComboId ? '?/updateCombo' : '?/addCombo'}
			use:enhance={save.enhance}
			class="flex flex-col gap-3"
		>
			{#if editingComboId}
				<input type="hidden" name="comboId" value={editingComboId} />
			{/if}

			<div class="flex gap-2">
				<Input
					type="text"
					name="name"
					bind:value={comboName}
					placeholder="Combo name..."
					required
					class="text-sm flex-1"
				/>
				<Input
					type="text"
					inputmode="numeric"
					pattern="\d*"
					name="bonusPoints"
					bind:value={comboBonusPoints}
					class="text-sm w-[56px]"
					oninput={(e: Event) => {
						const t = e.target as HTMLInputElement;
						t.value = t.value.replace(/\D/g, '');
						comboBonusPoints = t.value;
					}}
				/>
				<SubmitButton
					size="icon"
					iconOnly
					class="shrink-0"
					submitting={save.submitting}
					disabled={comboItems.length < 2}
					title={editingComboId ? 'Save' : 'Add'}
				>
					<Check class="size-4" />
				</SubmitButton>
			</div>

			{#each comboItems as item (item.id)}
				<input type="hidden" name="phraseIds" value={item.id} />
			{/each}

			<div>
				<p class="text-sm text-muted-foreground mb-2">
					Drop phrases here ({comboItems.length} selected, min 2):
				</p>
				<div
					use:dndzone={{
						items: comboItems,
						flipDurationMs,
						type: 'combo-phrases',
						dropTargetStyle: {}
					}}
					onconsider={handleComboDnd}
					onfinalize={handleComboDnd}
					class="min-h-[100px] rounded-md border-2 border-dashed border-border p-2 transition-colors {comboItems.length ===
					0
						? 'flex items-center justify-center'
						: 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5'}"
				>
					{#if comboItems.length === 0}
						<div class="text-sm text-center text-muted-foreground pointer-events-none">
							Drag phrases here or click them below
						</div>
					{/if}
					{#each comboItems as item (item.id)}
						<button
							type="button"
							animate:flip={{ duration: flipDurationMs }}
							onclick={() => removeFromCombo(item)}
							class="aspect-square flex flex-col items-center justify-center text-center p-2 border-2 rounded-md bg-primary/10 border-primary cursor-pointer hover:bg-destructive/10 hover:border-destructive transition-colors"
						>
							<span class="font-medium text-sm leading-tight">{item.title}</span>
							{#if item.subtitle}
								<span class="text-xs text-muted-foreground">{item.subtitle}</span>
							{/if}
							<Badge variant="secondary" class="text-[0.65rem] mt-1">{item.basePoints} pts</Badge>
						</button>
					{/each}
				</div>
			</div>

			<div>
				<p class="text-sm text-muted-foreground mb-2">Available phrases:</p>
				<div
					use:dndzone={{
						items: poolItems,
						flipDurationMs,
						type: 'combo-phrases',
						dropTargetStyle: {}
					}}
					onconsider={handlePoolDnd}
					onfinalize={handlePoolDnd}
					class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 min-h-[60px]"
				>
					{#each poolItems as phrase (phrase.id)}
						<button
							type="button"
							animate:flip={{ duration: flipDurationMs }}
							onclick={() => addToCombo(phrase)}
							class="aspect-square flex flex-col items-center justify-center text-center p-2 border-2 rounded-md bg-card border-border transition-all hover:border-primary cursor-pointer"
						>
							<span class="font-medium text-sm leading-tight break-words">{phrase.title}</span>
							{#if phrase.subtitle}
								<span class="text-xs text-muted-foreground mt-0.5">{phrase.subtitle}</span>
							{/if}
							<Badge variant="secondary" class="text-[0.65rem] mt-1">{phrase.basePoints} pts</Badge>
						</button>
					{/each}
				</div>
			</div>
		</form>
	{/if}
</section>
