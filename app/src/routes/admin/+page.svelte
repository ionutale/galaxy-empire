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
	<h1 class="mb-8 text-3xl font-bold text-primary">Admin Dashboard</h1>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		<!-- Tools Section -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Tools</h2>
				<ul class="menu rounded-box bg-base-100 p-2">
					<li><a href="/admin/overview">Overview</a></li>
					<li><a href="/admin/missions">Missions</a></li>
					<li><a href="/admin/builds">Active Builds</a></li>
				</ul>
                <div class="divider"></div>
                <h3 class="font-bold text-sm">Actions</h3>
                <button class="btn btn-sm btn-warning" on:click={() => fetch('/api/admin/seed-mines', { method: 'POST' })}>Seed NPC Mines</button>
			</div>
		</div>

		<!-- Theme Manager Section -->
		<div class="card col-span-1 bg-base-200 shadow-xl md:col-span-2">
			<div class="card-body">
				<h2 class="card-title">Theme Manager</h2>
				<p class="text-sm opacity-70 mb-4">Select a theme to apply globally.</p>
				
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each themes as theme}
						<button
							class="btn btn-sm"
							class:btn-primary={currentTheme === theme}
							class:btn-outline={currentTheme !== theme}
							on:click={() => setTheme(theme)}
						>
							{theme}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
