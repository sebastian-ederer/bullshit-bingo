<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import ConfirmDeleteDialog from '$lib/components/ConfirmDeleteDialog.svelte';
	import { headerBack } from '$lib/stores/headerBack.svelte';
	import { enhance } from '$app/forms';
	import Shield from '@lucide/svelte/icons/shield';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import Users from '@lucide/svelte/icons/users';
	import Layers from '@lucide/svelte/icons/layers';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';

	let { data } = $props();

	headerBack.value = { href: '/' };

	let deleteForm: HTMLFormElement;

	let memberSince = $derived(
		data.user?.createdAt
			? new Date(data.user.createdAt).toLocaleDateString('en-GB', {
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				})
			: null
	);
</script>

<div class="flex flex-col items-center">
	<h1 class="text-2xl text-left w-full font-bold mb-6">Profile</h1>

	<Card.Root class="w-full max-w-sm">
		<Card.Content class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-lg font-semibold">{data.user?.username ?? 'N/A'}</span>
				{#if data.user?.role === 'admin'}
					<Badge variant="default" class="text-xs">
						<Shield class="size-3 mr-1" />
						Admin
					</Badge>
				{/if}
			</div>
			{#if memberSince}
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<CalendarDays class="size-4" />
					<span>Member since {memberSince}</span>
				</div>
			{/if}
		</Card.Content>
		<Card.Footer class="flex flex-col gap-2">
			{#if data.user?.role === 'admin'}
				<Button href="/admin" variant="outline" class="w-full justify-start">
					<Layers class="size-4 mr-2" />
					Card Manager
				</Button>
				<Button href="/admin/games" variant="outline" class="w-full justify-start">
					<Gamepad2 class="size-4 mr-2" />
					Game Sessions
				</Button>
				<Button href="/admin/users" variant="outline" class="w-full justify-start">
					<Users class="size-4 mr-2" />
					Users
				</Button>
			{/if}

			<Button href="/profile/change-password" variant="outline" class="w-full justify-start">
				<KeyRound class="size-4 mr-2" />
				Change Password
			</Button>
			<form method="POST" action="/logout" class="w-full">
				<Button type="submit" variant="outline" class="w-full justify-start">
					<LogOut class="size-4 mr-2" />
					Logout
				</Button>
			</form>

			<form bind:this={deleteForm} method="POST" action="?/delete" use:enhance class="w-full">
				<ConfirmDeleteDialog
					title="Delete Account"
					description="This will permanently delete your account and all associated data. This action cannot be undone."
					onconfirm={() => deleteForm.requestSubmit()}
					actionLabel="Delete Account"
				>
					{#snippet trigger(props)}
						<Button {...props} variant="destructive" class="w-full justify-start">
							<Trash2 class="size-4 mr-2" />
							Delete Account
						</Button>
					{/snippet}
				</ConfirmDeleteDialog>
			</form>
		</Card.Footer>
	</Card.Root>
</div>
