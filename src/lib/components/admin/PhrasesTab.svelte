<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Plus from '@lucide/svelte/icons/plus';
	import Check from '@lucide/svelte/icons/check';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';
	import ConfirmDeleteDialog from '$lib/components/ConfirmDeleteDialog.svelte';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import BingoCell from '$lib/components/BingoCell.svelte';
	import type { PhraseData } from '$lib/types';
	import { useSubmitting } from '$lib/stores/submitting.svelte';

	type Props = {
		phrases: PhraseData[];
	};

	let { phrases }: Props = $props();

	let editingPhrase = $state<string | null>(null);
	let deleteFormEl: HTMLFormElement | undefined = $state();

	let editTitle = $state('');
	let editSubtitle = $state('');
	let editPoints = $state('10');

	function selectPhrase(phrase: PhraseData) {
		editingPhrase = phrase.id;
		editTitle = phrase.title;
		editSubtitle = phrase.subtitle ?? '';
		editPoints = String(phrase.basePoints);
	}

	function clearForm() {
		editingPhrase = null;
		editTitle = '';
		editSubtitle = '';
		editPoints = '10';
	}

	const save = useSubmitting(() => {
		return async ({ update }) => {
			clearForm();
			await update();
		};
	});
</script>

<section class="mt-4">
	<div class="flex gap-2 flex-wrap mb-4">
		<form
			method="POST"
			action={editingPhrase ? '?/updatePhrase' : '?/addPhrase'}
			use:enhance={save.enhance}
			class="contents"
		>
			{#if editingPhrase}
				<input type="hidden" name="phraseId" value={editingPhrase} />
			{/if}
			<Input
				type="text"
				name="title"
				bind:value={editTitle}
				placeholder="Title..."
				required
				class="text-sm"
			/>
			<Input
				type="text"
				name="subtitle"
				bind:value={editSubtitle}
				placeholder="Subtitle (optional)"
				class="text-sm"
			/>
			<Input
				type="text"
				inputmode="numeric"
				pattern="\d*"
				name="basePoints"
				bind:value={editPoints}
				class="text-sm w-[56px]"
				oninput={(e: Event) => {
					const t = e.target as HTMLInputElement;
					t.value = t.value.replace(/\D/g, '');
					editPoints = t.value;
				}}
			/>
			<SubmitButton size="icon" iconOnly class="shrink-0" submitting={save.submitting} title={editingPhrase ? 'Save' : 'Add'}>
				{#if editingPhrase}
					<Check class="size-4" />
				{:else}
					<Plus class="size-4" />
				{/if}
			</SubmitButton>
		</form>
		{#if editingPhrase}
			<form
				method="POST"
				action="?/deletePhrase"
				use:enhance={() => {
					return async ({ update }) => {
						clearForm();
						await update();
					};
				}}
				bind:this={deleteFormEl}
				class="contents"
			>
				<input type="hidden" name="phraseId" value={editingPhrase} />
				<ConfirmDeleteDialog
					title="Delete Card"
					description="Are you sure you want to delete this card? Any combos using it will also be deleted."
					onconfirm={() => deleteFormEl?.requestSubmit()}
				>
					{#snippet trigger(props)}
						<Button {...props} variant="destructive" size="icon" class="shrink-0" title="Delete">
							<Trash2 class="size-4" />
						</Button>
					{/snippet}
				</ConfirmDeleteDialog>
			</form>
			<Button
				type="button"
				variant="outline"
				size="icon"
				class="shrink-0"
				onclick={clearForm}
				title="Cancel"
			>
				<X class="size-4" />
			</Button>
		{/if}
	</div>

	{#if phrases.length === 0}
		<p class="text-muted-foreground italic">No phrases yet. Add some above!</p>
	{:else}
		<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
			{#each phrases as phrase (phrase.id)}
				<BingoCell
					title={phrase.title}
					subtitle={phrase.subtitle}
					points={phrase.basePoints}
					marked={editingPhrase === phrase.id}
					onclick={() => selectPhrase(phrase)}
				/>
			{/each}
		</div>
	{/if}
</section>
