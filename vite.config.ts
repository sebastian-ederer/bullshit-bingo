import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [
			tailwindcss(),
			sveltekit(),
			SvelteKitPWA({
				registerType: 'autoUpdate',
				includeAssets: ['offline.html'],
				manifest: {
					name: env.APP_NAME || 'Bullshit Bingo',
					short_name: env.APP_SHORT_NAME || env.APP_NAME || 'Bullshit Bingo',
					description: env.APP_DESCRIPTION || 'Play Bingo with friends in real-time',
					theme_color: '#1a1a2e',
					background_color: '#1a1a2e',
					display: 'standalone',
					orientation: 'portrait',
					scope: '/',
					start_url: '/',
					icons: [
						{
							src: '/logo/192.png',
							sizes: '192x192',
							type: 'image/png'
						},
						{
							src: '/logo/512.png',
							sizes: '512x512',
							type: 'image/png'
						},
						{
							src: '/logo/512.png',
							sizes: '512x512',
							type: 'image/png',
							purpose: 'maskable'
						}
					]
				},
				workbox: {
					globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}'],
					navigateFallback: null,
					runtimeCaching: [
						{
							urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
							handler: 'NetworkOnly' as const,
							options: {
								plugins: [
									{
										handlerDidError: async () =>
											(await caches.match('/offline.html', { ignoreSearch: true })) ||
											Response.error()
									}
								]
							}
						},
						{
							urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
							handler: 'CacheFirst' as const,
							options: {
								cacheName: 'images',
								expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }
							}
						}
					]
				},
				devOptions: {
					enabled: false
				}
			})
		],
		optimizeDeps: {
			exclude: [
				'bits-ui',
				'@lucide/svelte',
				'svelte-sonner',
				'svelte-dnd-action',
				'embla-carousel-svelte'
			]
		},
		ssr: {
			noExternal: ['svelte-sonner']
		},
		test: {
			expect: { requireAssertions: true },
			projects: [
				{
					extends: './vite.config.ts',
					test: {
						name: 'client',
						browser: {
							enabled: true,
							provider: playwright(),
							instances: [{ browser: 'chromium', headless: true }]
						},
						include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
						exclude: ['src/lib/server/**']
					}
				},

				{
					extends: './vite.config.ts',
					test: {
						name: 'server',
						environment: 'node',
						include: ['src/**/*.{test,spec}.{js,ts}'],
						exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
					}
				}
			]
		}
	};
});
