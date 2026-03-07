<script lang="ts">
	import { enhance } from '$app/forms';
	import DeckBuilder from '$lib/components/DeckBuilder.svelte';
	import { Input } from '$lib/components/ui/input';
	import Check from '@lucide/svelte/icons/check';
	import FormError from '$lib/components/FormError.svelte';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import { headerBack } from '$lib/stores/headerBack.svelte';
	import { useSubmitting } from '$lib/stores/submitting.svelte';

	headerBack.value = { href: '/decks' };

	let { data, form } = $props();

	let selectedIds = $state<string[]>([]);
	let deckName = $state('');
	const save = useSubmitting();
</script>

<svelte:head>
	<title>New Deck - Attention Bingo</title>
</svelte:head>

<div>
	<h1 class="text-2xl font-bold mb-6">Create New Deck</h1>

	<FormError error={form?.error} />

	<form method="POST" use:enhance={save.enhance} class="flex flex-col gap-6">
		<input type="hidden" name="phraseIds" value={JSON.stringify(selectedIds)} />

		<div class="flex gap-2 items-center">
			<Input
				type="text"
				name="name"
				required
				bind:value={deckName}
				placeholder="Deck name..."
				class="text-sm"
			/>
			<SubmitButton size="icon" iconOnly class="shrink-0" submitting={save.submitting} disabled={!deckName.trim()} title="Save Deck">
				<Check class="size-4" />
			</SubmitButton>
		</div>

		<DeckBuilder
			phrases={data.phrases}
			{selectedIds}
			combos={data.combos}
			onselect={(ids) => (selectedIds = ids)}
		/>
	</form>
</div>
