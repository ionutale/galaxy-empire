<script lang="ts">
	import '../app.css';
	import { onMount, setContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ChatBox from '$lib/components/ChatBox.svelte';
	import ResourceBar from '$lib/components/ResourceBar.svelte';
	import FleetDrawer from '$lib/components/FleetDrawer.svelte';
	import BuildQueue from '$lib/components/BuildQueue.svelte';

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
	let theme = 'light';
	let drawerOpen = false;
	let buildsDrawerOpen = false;
	let state: any = null;
	let now = Date.now();

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
		try {
			document.documentElement.setAttribute('data-theme', t);
		} catch (e) {}
		localStorage.setItem('ge:theme', t);
	}

	async function logout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
		} catch {}
		await goto('/');
	}

	async function loadState() {
		if (!user) return;
		try {
			const res = await fetch('/api/player/state');
			if (res.ok) {
				const body = await res.json();
				state = body.state;
				console.log('[layout] loaded state', { builds: state.builds, count: state.builds?.length });
			}
		} catch {}
	}

	onMount(() => {
		try {
			const saved = localStorage.getItem('ge:theme');
			if (saved) applyTheme(saved);
			else applyTheme(theme);
		} catch (e) {
			applyTheme(theme);
		}

		if (user) {
			loadState();
			const interval = setInterval(() => {
				now = Date.now();
			}, 1000);

			const tickInterval = setInterval(async () => {
				try {
					const res = await fetch('/api/demo/process/tick', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ seconds: 5 })
					});
					if (res.ok) {
						const data = await res.json();
						if (
							(data.builds && data.builds.length > 0) ||
							(data.fleets && data.fleets.length > 0)
						) {
							loadState();
						}
					}
				} catch (e) {
					console.error('Tick error', e);
				}
			}, 5000);

			window.addEventListener('player:changed', loadState);
			return () => {
				clearInterval(interval);
				clearInterval(tickInterval);
				window.removeEventListener('player:changed', loadState);
			};
		}
	});

	$: isPhoneDemo = $page.url.pathname.startsWith('/demo/phone');
	
	// Builds are passed raw to BuildQueue, which handles processing
	$: builds = state?.builds || [];
	
	// Active builds count for the badge
	$: activeBuildsCount = builds.filter((b: any) => b.status === 'in-progress' || b.status === 'queued').length;
	
	$: fleets = state?.fleets || [];

	let historyPage = 1;

	async function loadMoreHistory() {
		historyPage++;
		try {
			const res = await fetch(`/api/player/builds/history?page=${historyPage}&limit=10`);
			if (res.ok) {
				const newHistory = await res.json();
				if (newHistory.length > 0) {
					const mappedHistory = newHistory.map((b: any) => ({
						id: b.id,
						type: b.type,
						buildingId: b.buildingId,
						shipTemplateId: b.shipTemplateId,
						techId: b.techId,
						quantity: b.quantity,
						status: 'completed',
						createdAt: b.processedAt,
						durationSeconds: 0,
						remainingSeconds: 0,
						level: b.level,
						processedAt: b.processedAt
					}));
					
					// Append to state.builds
					state.builds = [...state.builds, ...mappedHistory];
				}
			}
		} catch (e) {
			console.error('Failed to load history', e);
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="Galaxy Empire — a small SvelteKit demo game" />
</svelte:head>

{#if !isPhoneDemo}
	<!-- Responsive drawer (sidebar) layout using daisyUI -->
	<div class="drawer relative drawer-end min-h-screen text-slate-200">
		<input
			id="builds-drawer"
			type="checkbox"
			class="drawer-toggle"
			bind:checked={buildsDrawerOpen}
		/>
		<div class="drawer-content flex h-full flex-col">
			<div class="drawer h-full lg:drawer-open">
				<input id="app-drawer" type="checkbox" class="drawer-toggle" bind:checked={drawerOpen} />
				<div class="drawer-content flex flex-col">
					<!-- Top bar for mobile with menu toggle -->
					<header
						class="sticky top-0 z-30 w-full glass-panel mb-4"
					>
						<div class="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
							<div class="flex items-center gap-3">
								<label for="app-drawer" class="btn btn-square btn-ghost lg:hidden">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										class="inline-block h-6 w-6 stroke-current"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 6h16M4 12h16M4 18h16"
										></path></svg
									>
								</label>
								<a href="/" class="text-lg font-bold">Galaxy Empire</a>
							</div>
							<!-- navigation moved to sidebar drawer -->
							<div class="hidden items-center gap-2 lg:flex" aria-hidden="true"></div>
							<div class="flex-1"></div>
							{#if user}
								<label for="builds-drawer" class="btn mr-2 btn-circle btn-ghost">
									<div class="indicator">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.5"
											stroke="currentColor"
											class="h-6 w-6"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
											/>
										</svg>
										{#if activeBuildsCount > 0}
											<span class="indicator-item badge badge-xs badge-primary"
												>{activeBuildsCount}</span
											>
										{/if}
									</div>
								</label>
								<div class="hidden items-center md:flex">
									<ResourceBar />
								</div>
								<button class="btn btn-ghost btn-sm" on:click={logout}>Logout</button>
							{/if}
						</div>
					</header>

					<main class="container mx-auto flex-1 px-4 py-8">
						<slot />
					</main>

					<footer class="footer-center footer glass-panel p-6 mt-8 rounded-t-xl mx-4">
						<div>
							<p>© {year} Galaxy Empire — development build</p>
							<p class="text-muted text-sm">Built with SvelteKit · DaisyUI · Drizzle</p>
						</div>
					</footer>
				</div>
				{#if user}
					<div class="drawer-side">
						<label for="app-drawer" class="drawer-overlay"></label>
						<aside
							class="relative z-10 w-72 glass-panel p-4 text-slate-200 m-4 rounded-xl h-[calc(100vh-2rem)]"
						>
							<div class="mb-4">
								<a href="/" class="text-2xl font-bold">Galaxy Empire</a>
								<p class="text-sm opacity-70">Command center</p>
							</div>
							<Sidebar on:navigate={closeDrawerOnMobile} />

						</aside>
						<!-- global toast container -->
					</div>
				{/if}
			</div>
		</div>
		<Toast />
		{#if user}
			<ChatBox />
		{/if}
		<div class="drawer-side z-50">
			<label for="builds-drawer" class="drawer-overlay"></label>
			<div class="menu min-h-full w-80 glass-panel p-0 text-slate-200 overflow-hidden flex flex-col">
				<!-- Tabbed Drawer Content -->
				<div role="tablist" class="tabs tabs-lifted tabs-lg grid grid-cols-2 bg-black/20">
					<input 
						type="radio" 
						name="drawer_tabs" 
						role="tab" 
						class="tab text-slate-400 checked:text-neon-blue checked:bg-transparent checked:border-b-2 checked:border-neon-blue font-bold tracking-wide h-14" 
						aria-label="Builds" 
						checked 
					/>
					<div role="tabpanel" class="tab-content h-[calc(100vh-3.5rem)] bg-transparent border-none p-0 overflow-hidden">
						<BuildQueue {builds} {user} on:loadMore={loadMoreHistory} />
					</div>

					<input 
						type="radio" 
						name="drawer_tabs" 
						role="tab" 
						class="tab text-slate-400 checked:text-neon-blue checked:bg-transparent checked:border-b-2 checked:border-neon-blue font-bold tracking-wide h-14" 
						aria-label="Fleets" 
					/>
					<div role="tabpanel" class="tab-content h-[calc(100vh-3.5rem)] bg-transparent border-none p-0 overflow-hidden">
						<FleetDrawer fleets={fleets || []} />
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- Phone demo wants full control -->
	<slot />
{/if}
