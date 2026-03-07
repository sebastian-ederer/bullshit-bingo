<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Dialog from '$lib/components/ui/dialog';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ConfirmDeleteDialog from '$lib/components/ConfirmDeleteDialog.svelte';
	import { headerBack } from '$lib/stores/headerBack.svelte';
	import { useSubmitting } from '$lib/stores/submitting.svelte';

	headerBack.value = { href: '/profile' };

	let { data, form } = $props();

	let passwordDialogOpen = $state(false);
	let selectedUser = $state<{ id: string; username: string } | null>(null);
	let newPassword = $state('');
	const setPassword = useSubmitting();

	$effect(() => {
		if (form?.success) {
			toast.success(form.message ?? 'Done.');
			passwordDialogOpen = false;
			newPassword = '';
			selectedUser = null;
		}
		if (form?.error) {
			toast.error(form.error);
		}
	});

	function openPasswordDialog(user: { id: string; username: string }) {
		selectedUser = user;
		newPassword = '';
		passwordDialogOpen = true;
	}
</script>

<svelte:head>
	<title>Users - Admin</title>
</svelte:head>

<div>
	<h1 class="text-2xl font-bold mb-4">Users ({data.users.length})</h1>

	{#if data.users.length === 0}
		<p class="text-muted-foreground italic text-center">No users yet.</p>
	{:else}
		<div class="flex flex-col gap-2">
			{#each data.users as user (user.id)}
				<Card.Root class="flex flex-row items-center justify-between px-4 py-3">
					<div class="flex flex-col gap-0.5">
						<span class="text-sm font-medium">{user.username}</span>
						<span class="text-xs text-muted-foreground">
							Joined {new Date(user.createdAt).toLocaleDateString('en-GB', {
								day: 'numeric',
								month: 'short',
								year: 'numeric'
							})}
						</span>
					</div>
					<div class="flex items-center gap-2">
						{#if user.role === 'admin'}
							<Badge variant="default">admin</Badge>
						{/if}
						<Button
							variant="outline"
							size="icon-sm"
							title="Change password"
							onclick={() => openPasswordDialog(user)}
						>
							<KeyRound class="size-4" />
						</Button>
						{#if user.role !== 'admin'}
							{@const formId = `delete-${user.id}`}
							<form id={formId} method="POST" action="?/deleteUser" use:enhance class="hidden">
								<input type="hidden" name="userId" value={user.id} />
							</form>
							<ConfirmDeleteDialog
								title="Delete User"
								description="This will permanently delete {user.username} and all their game data. This action cannot be undone."
								onconfirm={() => {
									const f = document.getElementById(formId) as HTMLFormElement;
									f.requestSubmit();
								}}
								actionLabel="Delete User"
							>
								{#snippet trigger(props)}
									<Button {...props} variant="outline" size="icon-sm" title="Delete user">
										<Trash2 class="size-4" />
									</Button>
								{/snippet}
							</ConfirmDeleteDialog>
						{/if}
					</div>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>

<Dialog.Root bind:open={passwordDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Change Password</Dialog.Title>
			<Dialog.Description>
				Set a new password for <strong>{selectedUser?.username}</strong>.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/setPassword"
			use:enhance={setPassword.enhance}
			class="flex flex-col gap-4"
		>
			<input type="hidden" name="userId" value={selectedUser?.id ?? ''} />
			<Input
				type="password"
				name="newPassword"
				bind:value={newPassword}
				placeholder="New password (min 6 characters)"
				required
				minlength={6}
				onblur={() => (newPassword = newPassword.trim())}
			/>
			<Dialog.Footer>
				<SubmitButton submitting={setPassword.submitting} disabled={newPassword.trim().length < 6}>Set Password</SubmitButton>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
