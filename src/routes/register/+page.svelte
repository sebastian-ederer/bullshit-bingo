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
	const register = useSubmitting();
</script>

<svelte:head>
	<title>Register - Attention Bingo</title>
</svelte:head>

<div class="mt-8">
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-2xl">Register</Card.Title>
		</Card.Header>
		<Card.Content>
			<FormError error={form?.error} />

			<form method="POST" use:enhance={register.enhance} class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<Label for="username">Username</Label>
					<Input
						type="text"
						id="username"
						name="username"
						required
						minlength={3}
						maxlength={20}
						pattern="[a-zA-Z0-9_.\-]+"
						title="Letters, numbers, underscore, dash, or dot only"
						autocomplete="username"
						bind:value={username}
						onblur={() => (username = username.trim())}
					/>
					<p class="text-xs text-muted-foreground">3–20 characters. Letters, numbers, _ - . only.</p>
				</div>

				<div class="flex flex-col gap-1.5">
					<Label for="password">Password</Label>
					<Input
						type="password"
						id="password"
						name="password"
						required
						minlength={6}
						autocomplete="new-password"
						bind:value={password}
						onblur={() => (password = password.trim())}
					/>
				</div>

				<SubmitButton class="mt-2" submitting={register.submitting}>Register</SubmitButton>
			</form>
		</Card.Content>
		<Card.Footer class="justify-center">
			<p class="text-sm text-muted-foreground">
				Already have an account? <a href="/login" class="text-primary hover:underline">Login</a>
			</p>
		</Card.Footer>
	</Card.Root>
</div>
