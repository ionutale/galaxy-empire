<script lang="ts">
	import '../app.css';
	import { onMount, setContext } from 'svelte';
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ResourceBar from '$lib/components/ResourceBar.svelte';
	import ChipsPanel from '$lib/components/ChipsPanel.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { writable } from 'svelte/store';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	const session = writable(data);
	setContext('session', session);

	$: session.set(data);
	$: user = $session.user;

	const year = new Date().getFullYear();
	let theme = 'emerald';
	const themes = ['emerald','synthwave','cyberpunk','coffee','forest','aqua','dark','light'] as const;
	let drawerOpen = false;
	function closeDrawerOnMobile() {
		try {
			if (window.matchMedia('(max-width: 1023px)').matches) {
				drawerOpen = false;
				const el = document.getElementById('app-drawer') as HTMLInputElement | null;
				if (el) el.checked = false;
			}
		} catch {}
	}

	function applyTheme(t: string) {
		theme = t;
		// set data-theme on html element (daisyUI reads this)
		try { document.documentElement.setAttribute('data-theme', t); } catch (e) {}
		localStorage.setItem('ge:theme', t);
	}

	onMount(() => {
		try {
			const saved = localStorage.getItem('ge:theme');
			if (saved) applyTheme(saved);
			else applyTheme(theme);
		} catch (e) {
			applyTheme(theme);
		}
	});
	$: isPhoneDemo = $page.url.pathname.startsWith('/demo/phone');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="Galaxy Empire — a small SvelteKit demo game" />
</svelte:head>

{#if !isPhoneDemo}
	<!-- Responsive drawer (sidebar) layout using daisyUI -->
	<div class="min-h-screen bg-base-100 text-base-content relative">
		<div aria-hidden="true" class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/10),transparent_60%),radial-gradient(ellipse_at_bottom,theme(colors.secondary/10),transparent_60%)]"></div>
		<div class="drawer lg:drawer-open">
			<input id="app-drawer" type="checkbox" class="drawer-toggle" bind:checked={drawerOpen} />
			<div class="drawer-content flex flex-col">
				<!-- Top bar for mobile with menu toggle -->
				<header class="w-full bg-base-100/80 backdrop-blur border-b border-base-300">
					<div class="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
						<div class="flex items-center gap-3">
							<label for="app-drawer" class="btn btn-ghost btn-square">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
							</label>
							<a href="/" class="font-bold text-lg">Galaxy Empire</a>
						</div>
						<!-- navigation moved to sidebar drawer -->
						<div class="hidden lg:flex items-center gap-2" aria-hidden="true"></div>
						<div class="flex-1"></div>
						{#if user}
						<div class="hidden md:flex items-center">
							<ResourceBar />
						</div>
						{/if}
					</div>
				</header>

				<main class="flex-1 container mx-auto px-4 py-8">
					<slot />
				</main>

				<footer class="footer footer-center p-6 bg-base-200">
					<div>
						<p>© {year} Galaxy Empire — development build</p>
						<p class="text-sm text-muted">Built with SvelteKit · DaisyUI · Drizzle</p>
					</div>
				</footer>
			</div>
			{#if user}
			<div class="drawer-side">
				<label for="app-drawer" class="drawer-overlay"></label>
				<aside class="w-72 bg-base-200 text-base-content p-4 relative z-10 border-r border-base-300">
					<div class="mb-4">
						<a href="/" class="text-2xl font-bold">Galaxy Empire</a>
						<p class="text-sm opacity-70">Command center</p>
					</div>
										<Sidebar on:navigate={closeDrawerOnMobile} />
										<div class="mt-4">
											<ChipsPanel />
										</div>
										<div class="mt-6">
						<div class="card bg-base-100 border border-base-300 p-3">
							<div class="text-sm">Theme</div>
							<div class="mt-2 flex flex-wrap gap-2">
								{#each themes as t}
									<button class="btn btn-xs" class:btn-outline={theme !== t} class:btn-primary={theme === t} on:click={() => applyTheme(t)} aria-pressed={theme === t}>{t}</button>
								{/each}
							</div>
						</div>
					</div>
				</aside>
				<!-- global toast container -->
				<Toast />
			</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- Phone demo wants full control -->
	<slot />
{/if}
