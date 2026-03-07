<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import PhrasesTab from '$lib/components/admin/PhrasesTab.svelte';
	import CombosTab from '$lib/components/admin/CombosTab.svelte';
	import { toast } from 'svelte-sonner';
	import { headerBack } from '$lib/stores/headerBack.svelte';

	headerBack.value = { href: '/profile' };

	let { data, form } = $props();

	$effect(() => {
		if (form?.success) toast.success('Changes saved!');
		if (form?.error) toast.error(form.error);
	});
</script>

<svelte:head>
	<title>Card Manager - Attention Bingo</title>
</svelte:head>

<div>
	<h1 class="text-2xl font-bold mb-6">Card Manager</h1>

	<Tabs.Root value="cards">
		<Tabs.List class="w-full">
			<Tabs.Trigger value="cards">Cards ({data.phrases.length})</Tabs.Trigger>
			<Tabs.Trigger value="combos">Combos ({data.combos.length})</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="cards">
			<PhrasesTab phrases={data.phrases} />
		</Tabs.Content>

		<Tabs.Content value="combos">
			<CombosTab phrases={data.phrases} combos={data.combos} />
		</Tabs.Content>
	</Tabs.Root>
</div>
