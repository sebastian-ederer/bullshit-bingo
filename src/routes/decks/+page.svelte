<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ConfirmDeleteDialog from '$lib/components/ConfirmDeleteDialog.svelte';
	import FormError from '$lib/components/FormError.svelte';
	import { headerBack } from '$lib/stores/headerBack.svelte';

	headerBack.value = { href: '/' };

	let { data, form } = $props();
	let deleteDeckFormEls: Record<string, HTMLFormElement> = $state({});
</script>

<svelte:head>
	<title>My Decks - Attention Bingo</title>
</svelte:head>

<div>
	<h1 class="text-2xl font-bold mb-6">My Decks</h1>

	<FormError error={form?.error} />

	<div class="mb-6">
		<Button href="/decks/new">Create New Deck</Button>
	</div>

	{#if data.decks.length === 0}
		<p class="text-muted-foreground italic mt-4 text-center">
			You have no decks yet. Create one to start playing!
		</p>
	{:else}
		<div class="flex flex-col gap-2">
			{#each data.decks as deck (deck.id)}
				<a href="/decks/{deck.id}/edit" class="block">
					<Card.Root
						class="flex flex-row items-center justify-between px-4 py-3 hover:bg-accent transition-colors{deck.validPhraseCount !== 9
							? ' border-destructive'
							: ''}"
					>
						<div class="flex flex-col gap-0.5">
							<strong class="text-sm">{deck.name}</strong>
							<span class="text-xs text-muted-foreground">{deck.validPhraseCount} phrases</span>
						</div>
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="flex gap-2 items-center"
							onclick={(e) => e.preventDefault()}
							onkeydown={(e) => { if (e.key === 'Enter') e.stopPropagation(); }}
						>
							<form
								method="POST"
								action="?/delete"
								use:enhance
								bind:this={deleteDeckFormEls[deck.id]}
								class="contents"
							>
								<input type="hidden" name="deckId" value={deck.id} />
								<ConfirmDeleteDialog
									title="Delete Deck"
									description={'Are you sure you want to delete "' + deck.name + '"? This action cannot be undone.'}
									onconfirm={() => deleteDeckFormEls[deck.id]?.requestSubmit()}
								>
									{#snippet trigger(props)}
										<Button {...props} variant="outline" size="icon-sm"
											><Trash2 class="size-4" /></Button
										>
									{/snippet}
								</ConfirmDeleteDialog>
							</form>
						</div>
					</Card.Root>
				</a>
			{/each}
		</div>
	{/if}
</div>
