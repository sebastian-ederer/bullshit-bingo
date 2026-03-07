<script lang="ts">
	import { page } from '$app/state';
	import { headerBack } from '$lib/stores/headerBack.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CircleUser from '@lucide/svelte/icons/circle-user';
</script>

<header class="glass-bar fixed top-0 left-0 right-0 z-50 border-b" style="padding-top: env(safe-area-inset-top)">
	<div class="mx-auto max-w-[960px] px-4 h-12 flex items-center justify-between">
		<div class="w-8">
			{#if headerBack.value}
				<a
					href={headerBack.value.href}
					class="text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft class="size-5" />
				</a>
			{/if}
		</div>

		<a href={page.data.user ? '/profile' : '/login'}>
			<Avatar.Root class="bg-white/10 backdrop-blur-lg">
				<Avatar.Fallback class="bg-transparent">
					<CircleUser class="size-5 text-primary" />
				</Avatar.Fallback>
			</Avatar.Root>
		</a>
	</div>
</header>
