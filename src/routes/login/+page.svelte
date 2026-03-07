<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import FormError from '$lib/components/FormError.svelte';
	import SubmitButton from '$lib/components/SubmitButton.svelte';
	import { useSubmitting } from '$lib/stores/submitting.svelte';

	let { form } = $props();

	let username = $state('');
	let password = $state('');
	const login = useSubmitting();
</script>

<svelte:head>
	<title>Login - Attention Bingo</title>
</svelte:head>

<div class="mt-8">
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-2xl">Login</Card.Title>
		</Card.Header>
		<Card.Content>
			<FormError error={form?.error} />

			<form method="POST" use:enhance={login.enhance} class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<Label for="username">Username</Label>
					<Input
						type="text"
						id="username"
						name="username"
						required
						autocomplete="username"
						bind:value={username}
						onblur={() => (username = username.trim())}
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<Label for="password">Password</Label>
					<Input
						type="password"
						id="password"
						name="password"
						required
						autocomplete="current-password"
						bind:value={password}
						onblur={() => (password = password.trim())}
					/>
				</div>

				<SubmitButton class="mt-2" submitting={login.submitting}>Login</SubmitButton>
			</form>
		</Card.Content>
		<Card.Footer class="justify-center">
			<p class="text-sm text-muted-foreground">
				Don't have an account? <a href="/register" class="text-primary hover:underline">Register</a>
			</p>
		</Card.Footer>
	</Card.Root>
</div>
