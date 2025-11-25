<script lang="ts">
	import '../app.css';
	import { onMount, setContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ChatBox from '$lib/components/ChatBox.svelte';
	import ResourceBar from '$lib/components/ResourceBar.svelte';
	import FleetDrawer from '$lib/components/FleetDrawer.svelte';

	import Toast from '$lib/components/Toast.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { writable } from 'svelte/store';
	import type { LayoutData } from './$types';
	import { BUILDING_DATA, SHIP_TEMPLATES, RESEARCH_DATA } from '$lib/data/gameData';

	export let data: LayoutData;

	const session = writable(data);
	setContext('session', session);

	const SHIP_DATA = SHIP_TEMPLATES.reduce(
		(acc, s) => {
			acc[s.shipId] = s;
			return acc;
		},
		{} as Record<string, any>
	);

	$: session.set(data);
	$: user = $session.user;

	const year = new Date().getFullYear();
	let theme = 'light';
	const themes = ['light', 'dark'] as const;
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
		// set data-theme on html element (daisyUI reads this)
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

			// Game loop: tick the server every 5 seconds to process builds/fleets
			const tickInterval = setInterval(async () => {
				try {
					const res = await fetch('/api/demo/process/tick', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ seconds: 5 })
					});
					if (res.ok) {
						const data = await res.json();
						// if anything was processed, reload state to reflect changes
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
	$: builds = [...(state?.builds ?? [])]
		.map((b) => {
			if (b.status === 'completed') return { ...b, remainingSeconds: 0 };
			if (b.status === 'queued') return { ...b, remainingSeconds: b.durationSeconds };

			const startTime = new Date(b.createdAt).getTime();
			const endTime = startTime + b.durationSeconds * 1000;
			const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
			return { ...b, remainingSeconds: remaining };
		})
		.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	$: activeBuilds = builds.filter((b: any) => b.status === 'in-progress' || b.status === 'queued');
	$: activeBuildsCount = activeBuilds.length;
	$: processedBuilds = builds.filter((b: any) => b.status === 'completed');
	$: fleets = state?.fleets || [];

	function formatName(id: string) {
		if (!id) return 'Unknown';
		if (BUILDING_DATA[id]) return BUILDING_DATA[id].name;
		if (SHIP_DATA[id]) return SHIP_DATA[id].name;
		if (RESEARCH_DATA[id as keyof typeof RESEARCH_DATA]) return RESEARCH_DATA[id as keyof typeof RESEARCH_DATA].name;
		return id;
	}

	function formatTime(seconds: number) {
		if (seconds == null) return '-';
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		if (h > 0) return `${h}h ${m}m ${s}s`;
		if (m > 0) return `${m}m ${s}s`;
		return `${s}s`;
	}

	function getRemainingTime(build: any, currentNow: number) {
		if (build.status === 'completed') return 'Completed';

		let remaining = 0;
		if (build.status === 'queued') {
			remaining = build.durationSeconds;
		} else {
			const startTime = new Date(build.createdAt).getTime();
			const endTime = startTime + build.durationSeconds * 1000;
			remaining = Math.max(0, Math.floor((endTime - currentNow) / 1000));
			if (remaining <= 0) return 'Finishing...';
		}

		const hours = Math.floor(remaining / 3600);
		const minutes = Math.floor((remaining % 3600) / 60);
		const seconds = remaining % 60;

		if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
		if (minutes > 0) return `${minutes}m ${seconds}s`;
		return `${seconds}s`;
	}

	async function cancelBuild(buildId: string) {
		try {
			const res = await fetch('/api/demo/builds/cancel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ buildId })
			});
			if (res.ok) {
				const body = await res.json();
				if (body.state) {
					state = body.state;
				} else {
					await loadState();
				}
			}
		} catch (e) {
			console.error('Failed to cancel build', e);
		}
	}

	let historyPage = 1;
	let loadingHistory = false;

	async function loadMoreHistory() {
		loadingHistory = true;
		historyPage++;
		try {
			const res = await fetch(`/api/player/builds/history?page=${historyPage}&limit=10`);
			if (res.ok) {
				const newHistory = await res.json();
				if (newHistory.length > 0) {
					// Map history to match build structure
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
						level: b.level
					}));
					
					// Append to state.builds
					// We need to be careful not to duplicate if state reloads
					// For now, just append. If state reloads, it resets to top 10, so we might lose these.
					// Ideally, state should handle this, but for "Load More" transient appending is often acceptable.
					// Or we keep a separate `historyBuilds` array and merge it.
					state.builds = [...state.builds, ...mappedHistory];
				}
			}
		} catch (e) {
			console.error('Failed to load history', e);
		} finally {
			loadingHistory = false;
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
			<div class="menu min-h-full w-80 glass-panel p-4 text-slate-200">
				<!-- Tabbed Drawer Content -->
				<!-- Tabbed Drawer Content -->
				<div role="tablist" class="tabs tabs-bordered grid grid-cols-2 mb-4">
					<input 
						type="radio" 
						name="drawer_tabs" 
						role="tab" 
						class="tab text-slate-400 checked:text-neon-blue checked:border-neon-blue font-bold tracking-wide" 
						aria-label="Builds" 
						checked 
					/>
					<div role="tabpanel" class="tab-content pt-4 border-none">
						<h2 class="text-xl font-bold text-neon-blue mb-4 flex items-center gap-2">
							<span>🏗️</span> Construction Queue
						</h2>
						{#if !user}
							<div class="p-4 text-center opacity-50">Log in to view queue</div>
						{:else if (!builds || builds.length === 0) && (!processedBuilds || processedBuilds.length === 0)}
							<div class="p-4 text-center opacity-50">Queue is empty</div>
						{:else}
							<!-- Active Builds -->
							{#if activeBuilds && activeBuilds.length > 0}
								<div class="space-y-2 mb-6">
									<h3 class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">In Progress</h3>
									{#each activeBuilds as build (build.id)}
										<div class="card bg-white/5 border border-white/10 p-3 relative overflow-hidden group">
											<div class="flex justify-between items-start relative z-10">
												<div>
													<div class="font-bold text-sm">{formatName(build.buildingId || build.techId || build.shipTemplateId || 'Unknown')}</div>
													<div class="text-xs opacity-70 flex items-center gap-1">
														<span>⏱️</span>
														<span class="font-mono">{formatTime(build.remainingSeconds)}</span>
													</div>
												</div>
												<div class="badge badge-sm badge-primary">{build.type}</div>
											</div>
											<!-- Progress Bar -->
											<div class="absolute bottom-0 left-0 h-1 bg-neon-blue/50 transition-all duration-1000" style="width: {((build.totalDuration - build.remainingSeconds) / build.totalDuration) * 100}%"></div>
										</div>
									{/each}
								</div>
							{/if}

							<!-- History -->
							{#if processedBuilds && processedBuilds.length > 0}
								<div class="space-y-2">
									<h3 class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Completed</h3>
									{#each processedBuilds as build (build.id)}
										<div class="card bg-white/5 border border-white/5 p-2 opacity-70 hover:opacity-100 transition-opacity">
											<div class="flex justify-between items-center">
												<div class="text-sm">{formatName(build.buildingId || build.techId || build.shipTemplateId || 'Unknown')}</div>
												<div class="text-xs text-green-400">Done</div>
											</div>
											<div class="text-[10px] text-slate-500">{new Date(build.processedAt).toLocaleString()}</div>
										</div>
									{/each}
									
									<div class="pt-2 flex justify-center">
										<button class="btn btn-xs btn-ghost text-slate-500" on:click={loadMoreHistory}>
											Load More
										</button>
									</div>
								</div>
							{/if}
						{/if}
					</div>

					<input 
						type="radio" 
						name="drawer_tabs" 
						role="tab" 
						class="tab text-slate-400 checked:text-neon-blue checked:border-neon-blue font-bold tracking-wide" 
						aria-label="Fleets" 
					/>
					<div role="tabpanel" class="tab-content pt-4 h-full border-none">
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
