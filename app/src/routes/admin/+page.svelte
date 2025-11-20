<script lang="ts">
	import { onMount } from 'svelte';

	const themes = ['light', 'dark'];

	let currentTheme = 'light';

	onMount(() => {
		currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
	});

	function setTheme(theme: string) {
		currentTheme = theme;
		document.documentElement.setAttribute('data-theme', theme);
		document.cookie = `theme=${theme}; path=/; max-age=31536000`; // 1 year
        localStorage.setItem('ge:theme', theme);
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-8 text-3xl font-bold font-display text-neon-blue tracking-wide drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">Admin Dashboard</h1>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		<!-- Tools Section -->
		<div class="glass-panel p-6 rounded-xl">
			<h2 class="text-xl font-bold font-display text-white mb-4">Tools</h2>
			<ul class="menu bg-white/5 rounded-lg p-2 text-slate-200">
				<li><a href="/admin/overview" class="hover:bg-white/10 hover:text-neon-blue">Overview</a></li>
				<li><a href="/admin/missions" class="hover:bg-white/10 hover:text-neon-blue">Missions</a></li>
				<li><a href="/admin/builds" class="hover:bg-white/10 hover:text-neon-blue">Active Builds</a></li>
			</ul>
			<div class="divider my-4 before:bg-white/10 after:bg-white/10"></div>
			<h3 class="font-bold text-sm text-slate-400 uppercase tracking-wider mb-3">Actions</h3>
			<button class="btn btn-sm bg-yellow-500/20 text-yellow-200 border-yellow-500/50 hover:bg-yellow-500/40 hover:border-yellow-500 w-full" on:click={() => fetch('/api/admin/seed-mines', { method: 'POST' })}>Seed NPC Mines</button>
		</div>

		<!-- Theme Manager Section -->
		<div class="glass-panel col-span-1 p-6 rounded-xl md:col-span-2">
			<h2 class="text-xl font-bold font-display text-white mb-2">Theme Manager</h2>
			<p class="text-sm text-slate-400 mb-6">Select a theme to apply globally.</p>
			
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
				{#each themes as theme}
					<button
						class="btn btn-sm capitalize"
						class:btn-primary={currentTheme === theme}
						class:bg-neon-blue={currentTheme === theme}
						class:text-black={currentTheme === theme}
						class:border-neon-blue={currentTheme === theme}
						class:btn-outline={currentTheme !== theme}
						class:text-slate-300={currentTheme !== theme}
						class:border-white/20={currentTheme !== theme}
						class:hover:bg-white/10={currentTheme !== theme}
						class:hover:text-white={currentTheme !== theme}
						on:click={() => setTheme(theme)}
					>
						{theme}
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>
