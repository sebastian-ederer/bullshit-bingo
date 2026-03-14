<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import DeckBuilder from '$lib/components/DeckBuilder.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Check from '@lucide/svelte/icons/check';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import ConfirmDeleteDialog from '$lib/components/ConfirmDeleteDialog.svelte';
	import { headerBack } from '$lib/stores/headerBack.svelte';
	import { useSubmitting } from '$lib/stores/submitting.svelte';

	headerBack.value = { href: '/decks' };

	let { data, form } = $props();
	let deleteFormEl: HTMLFormElement | undefined = $state();

	let selectedIds = $state<string[]>([]);
	let deckName = $state('');
	const save = useSubmitting((input) => {
		return async ({ result, update }) => {
			if (result.type === 'success') {
				toast.success('Deck saved successfully!');
			} else if (result.type === 'failure') {
				toast.error(String(result.data?.error ?? 'Failed to save deck.'));
			}
			await update({ reset: false });
		};
	});

	$effect(() => {
		selectedIds = data.deck.phraseIds as string[];
		deckName = data.deck.name;
	});
</script>

<svelte:head>
	<title>Edit Deck - {data.appName}</title>
</svelte:head>

<div>
	<h1 class="text-2xl font-bold mb-6">Edit Deck</h1>

	<div class="flex gap-2 items-center mb-6">
		<form method="POST" action="?/update" use:enhance={save.enhance} class="contents">
			<input type="hidden" name="phraseIds" value={JSON.stringify(selectedIds)} />
			<Input
				type="text"
				name="name"
				required
				bind:value={deckName}
				class="text-sm"
			/>
			<SubmitButton size="icon" iconOnly class="shrink-0" submitting={save.submitting} disabled={!deckName.trim()} title="Save">
				<Check class="size-4" />
			</SubmitButton>
		</form>
		<form method="POST" action="?/delete" use:enhance bind:this={deleteFormEl} class="contents">
			<ConfirmDeleteDialog
				title="Delete Deck"
				description="Are you sure you want to delete this deck? This action cannot be undone."
				onconfirm={() => deleteFormEl?.requestSubmit()}
			>
				{#snippet trigger(props)}
					<Button {...props} variant="destructive" size="icon" class="shrink-0" title="Delete">
						<Trash2 class="size-4" />
					</Button>
				{/snippet}
			</ConfirmDeleteDialog>
		</form>
	</div>

	<DeckBuilder
		phrases={data.phrases}
		{selectedIds}
		combos={data.combos}
		onselect={(ids) => (selectedIds = ids)}
	/>
</div>
