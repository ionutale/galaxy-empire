<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';

	const year = new Date().getFullYear();
	let theme = 'emerald';

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
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="Galaxy Empire — a small SvelteKit demo game" />
</svelte:head>

<!-- Responsive drawer (sidebar) layout using daisyUI -->
<div data-theme="emerald" class="min-h-screen bg-base-100 text-base-content">
	<div class="drawer drawer-mobile">
		<input id="app-drawer" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content flex flex-col">
			<!-- Top bar for mobile with menu toggle -->
			<header class="w-full bg-transparent border-b border-base-200">
				<div class="container mx-auto px-4 py-3 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<label for="app-drawer" class="btn btn-ghost btn-square lg:hidden">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
						</label>
						<a href="/" class="font-bold text-lg">Galaxy Empire</a>
					</div>
					<div class="hidden lg:flex items-center gap-2">
						<a class="btn btn-ghost" href="/fleet">Fleet</a>
						<a class="btn btn-ghost" href="/shipyard">Shipyard</a>
						<a class="btn btn-ghost" href="/admin/overview">Admin</a>
						<a class="btn btn-primary" href="/demo/paraglide">Demos</a>
					</div>
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
		<div class="drawer-side">
			<label for="app-drawer" class="drawer-overlay"></label>
					<aside class="w-64 bg-gradient-to-b from-emerald-600 to-cyan-500 text-white p-4">
						<div class="mb-4">
							<a href="/" class="text-2xl font-bold">Galaxy Empire</a>
							<p class="text-sm opacity-90">Command center</p>
						</div>
						<nav class="menu p-2 gap-2">
							<ul class="space-y-1">
								<li>
									<a href="/" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/10 transition">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6"/></svg>
										<span>Home</span>
									</a>
								</li>
								<li>
									<a href="/fleet" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/10 transition">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M3 12h18M3 17h18"/></svg>
										<span>Fleet</span>
									</a>
								</li>
								<li>
									<a href="/shipyard" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/10 transition">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 21V7a2 2 0 00-2-2H6a2 2 0 00-2 2v14"/></svg>
										<span>Shipyard</span>
									</a>
								</li>
								<li>
									<a href="/base" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/10 transition">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 1.567-3 3.5S10.343 15 12 15s3-1.567 3-3.5S13.657 8 12 8z"/></svg>
										<span>Base</span>
									</a>
								</li>
								<li>
									<a href="/admin/overview" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/10 transition">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m2 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
										<span>Admin</span>
									</a>
								</li>
								<li>
									<a href="/demo" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/10 transition">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3"/></svg>
										<span>Demos</span>
									</a>
								</li>
								<li>
									<a href="/register" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/10 transition">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4"/></svg>
										<span>Register</span>
									</a>
								</li>
								<li>
									<a href="/login" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/10 transition">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H3m12 0l-4-4m4 4l-4 4"/></svg>
										<span>Login</span>
									</a>
								</li>
							</ul>
						</nav>
						<div class="mt-6">
							<div class="card bg-white bg-opacity-10 p-3">
								<div class="text-sm">Theme</div>
								<div class="mt-2 flex gap-2">
									<button class="btn btn-sm btn-outline transition" on:click={() => applyTheme('emerald')} aria-pressed={theme === 'emerald'}>Emerald</button>
									<button class="btn btn-sm btn-ghost transition" on:click={() => applyTheme('dark')} aria-pressed={theme === 'dark'}>Dark</button>
								</div>
							</div>
						</div>
					</aside>
		</div>
	</div>
</div>
