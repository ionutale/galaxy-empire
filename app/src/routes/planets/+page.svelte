<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let planets: any[] = [];
	let loading = true;
	let renamingId: string | null = null;
	let newName = '';

	async function loadPlanets() {
		loading = true;
		try {
			const res = await fetch('/api/player/state');
			if (res.ok) {
				const data = await res.json();
				planets = data.state.planets || [];
			}
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function renamePlanet(id: string) {
		if (!newName.trim()) return;
		try {
			const res = await fetch('/api/planets/rename', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ planetId: id, name: newName })
			});
			if (res.ok) {
				renamingId = null;
				loadPlanets();
			}
		} catch (e) {
			console.error(e);
		}
	}

	onMount(loadPlanets);
</script>

<div class="mx-auto max-w-4xl p-6">
	<h1 class="mb-8 text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-purple-400">
		My Planets
	</h1>

	{#if loading}
		<div class="flex justify-center p-12">
			<span class="loading loading-spinner loading-lg text-primary"></span>
		</div>
	{:else if planets.length === 0}
		<div class="glass-panel p-8 text-center rounded-xl">
			<p class="text-slate-400">You don't own any planets yet.</p>
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each planets as planet}
				<div class="glass-panel p-5 rounded-xl border border-white/10 hover:border-neon-blue/50 transition-colors group relative overflow-hidden">
					<div class="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
						<button 
							class="btn btn-xs btn-ghost text-slate-400 hover:text-white"
							on:click={() => { renamingId = planet.id; newName = planet.name; }}
						>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
								<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
							</svg>
						</button>
					</div>

					<div class="flex items-center gap-3 mb-3">
						<div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-500/20">
							{planet.name[0].toUpperCase()}
						</div>
						<div class="flex-1 min-w-0">
							{#if renamingId === planet.id}
								<div class="join w-full">
									<input 
										type="text" 
										bind:value={newName} 
										class="input input-xs input-bordered join-item w-full bg-black/50 text-white" 
										autofocus
									/>
									<button class="btn btn-xs btn-primary join-item" on:click={() => renamePlanet(planet.id)}>Save</button>
									<button class="btn btn-xs btn-ghost join-item" on:click={() => renamingId = null}>✕</button>
								</div>
							{:else}
								<h3 class="font-bold text-lg truncate text-slate-100">{planet.name}</h3>
							{/if}
							<p class="text-xs text-slate-400">Type: <span class="capitalize text-slate-300">{planet.type.replace('_', ' ')}</span></p>
						</div>
					</div>

					<div class="space-y-2 mt-4">
						<div class="flex justify-between text-xs">
							<span class="text-slate-500">Location</span>
							<span class="font-mono text-neon-blue">{planet.systemId}:{planet.orbitIndex}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
