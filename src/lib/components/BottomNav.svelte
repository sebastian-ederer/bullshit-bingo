<script lang="ts">
	import { page } from '$app/state';
	import { activeGame, type GameTab } from '$lib/stores/activeGame.svelte';
	import House from '@lucide/svelte/icons/house';
	import Layers from '@lucide/svelte/icons/layers';
	import Trophy from '@lucide/svelte/icons/trophy';
	import Grid2x2 from '@lucide/svelte/icons/grid-2x2';
	import ChartNoAxesColumn from '@lucide/svelte/icons/chart-no-axes-column';
	import MessageCircle from '@lucide/svelte/icons/message-circle';

	const defaultItems = [
		{ href: '/', label: 'Home', icon: House },
		{ href: '/decks', label: 'Decks', icon: Layers },
		{ href: '/leaderboard', label: 'Leaderboard', icon: Trophy }
	];

	const gameItems: { tab: GameTab; label: string; icon: typeof Grid2x2 }[] = [
		{ tab: 'game', label: 'Game', icon: Grid2x2 },
		{ tab: 'scoreboard', label: 'Scoreboard', icon: ChartNoAxesColumn },
		{ tab: 'chat', label: 'Chat', icon: MessageCircle }
	];

	function isActive(pathname: string, href: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}
</script>

<nav class="glass-bar fixed bottom-0 left-0 right-0 z-50 border-t">
	<div class="mx-auto flex h-[60px] max-w-[960px] items-center justify-around">
		{#if activeGame.active}
			{#each gameItems as item (item.tab)}
				<button
					onclick={() => (activeGame.tab = item.tab)}
					class="relative flex flex-col items-center gap-0.5 text-xs transition-colors active:scale-90 {activeGame.tab === item.tab
						? 'text-primary'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{#if item.tab === 'chat' && activeGame.hasUnread && activeGame.tab !== 'chat'}
						<span class="absolute top-0 right-0 size-2 rounded-full bg-destructive"></span>
					{/if}
					<item.icon size={20} />
					<span>{item.label}</span>
				</button>
			{/each}
		{:else}
			{#each defaultItems as item (item.href)}
				{@const active = isActive(page.url.pathname, item.href)}
				<a
					href={item.href}
					class="flex flex-col items-center gap-0.5 text-xs transition-colors active:scale-90 {active
						? 'text-primary'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<item.icon size={20} />
					<span>{item.label}</span>
				</a>
			{/each}
		{/if}
	</div>
</nav>
