<script lang="ts">
	import '../app.css';
	import { pwaInfo } from 'virtual:pwa-info';
	import { Toaster } from 'svelte-sonner';
	import { beforeNavigate } from '$app/navigation';
	import { headerBack } from '$lib/stores/headerBack.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import HeaderBar from '$lib/components/HeaderBar.svelte';

	let { children } = $props();

	async function registerSW() {
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW();
		}
	}

	$effect(() => {
		registerSW();
	});

	beforeNavigate(() => {
		headerBack.value = null;
	});

	const RIPPLE_SELECTOR =
		'a, button, [data-slot="button"], [data-slot="card"], [role="button"], input[type="submit"]';

	function handlePointerDown(e: PointerEvent) {
		const target = (e.target as HTMLElement)?.closest?.(RIPPLE_SELECTOR);
		if (!target) return;
		// Skip disabled elements
		if ((target as HTMLButtonElement).disabled || target.getAttribute('aria-disabled') === 'true')
			return;

		const ripple = document.createElement('div');
		ripple.className = 'water-ripple';
		ripple.style.left = `${e.clientX}px`;
		ripple.style.top = `${e.clientY}px`;
		document.body.appendChild(ripple);
		ripple.addEventListener('animationend', () => ripple.remove());
	}
</script>

<svelte:head>
	{#if pwaInfo?.webManifest?.href}
		<link rel="manifest" href={pwaInfo.webManifest.href} />
	{/if}
</svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:body onpointerdown={handlePointerDown} />

<Toaster richColors />

<HeaderBar />

<main class="mx-auto max-w-[960px] min-h-dvh flex flex-col px-4 pb-20 py-6" style="padding-top: calc(4rem + env(safe-area-inset-top)); padding-bottom: calc(5rem + env(safe-area-inset-bottom))">
	{@render children()}
</main>

<BottomNav />
