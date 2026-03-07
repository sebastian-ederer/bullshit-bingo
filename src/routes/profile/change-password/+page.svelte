<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import { headerBack } from '$lib/stores/headerBack.svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { useSubmitting } from '$lib/stores/submitting.svelte';

	let { form } = $props();

	headerBack.value = { href: '/profile' };

	let currentPassword = $state('');
	let newPassword = $state('');
	const save = useSubmitting();

	$effect(() => {
		if (form?.success) {
			toast.success(form.message ?? 'Done.');
			currentPassword = '';
			newPassword = '';
		}
		if (form?.error) {
			toast.error(form.error);
		}
	});
</script>

<svelte:head>
	<title>Change Password</title>
</svelte:head>

<div class="flex flex-col items-center">
	<h1 class="text-2xl w-full text-left font-bold mb-6">Change Password</h1>

	<Card.Root class="w-full max-w-sm">
		<form method="POST" use:enhance={save.enhance} class="flex flex-col gap-3">
			<Card.Content class="flex flex-col gap-3">
				<Input
					type="password"
					name="currentPassword"
					bind:value={currentPassword}
					placeholder="Current password"
					required
					onblur={() => (currentPassword = currentPassword.trim())}
				/>
				<Input
					type="password"
					name="newPassword"
					bind:value={newPassword}
					placeholder="New password (min 6 characters)"
					required
					minlength={6}
					onblur={() => (newPassword = newPassword.trim())}
				/>
			</Card.Content>
			<Card.Footer>
				<SubmitButton
					class="w-full"
					submitting={save.submitting}
					disabled={!currentPassword.trim() || newPassword.trim().length < 6}
				>
					Update Password
				</SubmitButton>
			</Card.Footer>
		</form>
	</Card.Root>
</div>
