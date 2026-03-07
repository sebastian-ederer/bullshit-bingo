<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import FormError from '$lib/components/FormError.svelte';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import { headerBack } from '$lib/stores/headerBack.svelte';
	import { useSubmitting } from '$lib/stores/submitting.svelte';

	headerBack.value = { href: '/admin/games' };

	let { data, form } = $props();
	const create = useSubmitting();
</script>

<svelte:head>
	<title>New Game - Admin</title>
</svelte:head>

<div>
	<h1 class="text-2xl font-bold mb-6">Create New Game</h1>

	<FormError error={form?.error} />

	<Card.Root class="max-w-[480px]">
		<Card.Content class="pt-6">
			<form method="POST" use:enhance={create.enhance} class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<Label for="name">Game Name</Label>
					<Input type="text" id="name" name="name" required placeholder="e.g. Friday Meeting Bingo" />
				</div>

				<p class="text-sm text-muted-foreground italic">Scoring is based on per-field points and combo bonuses.</p>

				<SubmitButton class="self-start" submitting={create.submitting}>Create Game</SubmitButton>
			</form>
		</Card.Content>
	</Card.Root>
</div>
