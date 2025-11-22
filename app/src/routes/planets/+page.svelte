<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let planets: any[] = [];
	let loading = true;
	let editingId: string | null = null;
	let editName = '';

	onMount(async () => {
		await loadPlanets();
	});

	async function loadPlanets() {
		loading = true;
		const res = await fetch('/api/player/planets');
		if (res.ok) {
			const data = await res.json();
			planets = data.planets;
		}
		loading = false;
	}

	function startEdit(planet: any) {
		editingId = planet.id;
		editName = planet.name;
	}

	async function saveName(id: string) {
		if (!editName.trim()) return;
		
		const res = await fetch(`/api/planet/${id}/rename`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: editName })
		});

		if (res.ok) {
			const updated = await res.json();
			planets = planets.map(p => p.id === id ? { ...p, name: updated.name } : p);
			editingId = null;
		}
	}

	function cancelEdit() {
		editingId = null;
		editName = '';
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-6 text-primary font-display">My Colonies</h1>

	{#if loading}
		<div class="flex justify-center p-10">
			<span class="loading loading-spinner loading-lg text-primary"></span>
		</div>
	{:else if planets.length === 0}
		<div class="alert alert-info">
			<span>You haven't colonized any planets yet.</span>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each planets as planet}
				<div class="glass-panel p-6 rounded-xl border border-white/10 hover:border-neon-blue/50 transition-all group relative overflow-hidden">
					<!-- Background decoration -->
					<div class="absolute -right-10 -top-10 w-32 h-32 bg-neon-blue/5 rounded-full blur-3xl group-hover:bg-neon-blue/10 transition-all"></div>

					<div class="relative z-10">
						<div class="flex justify-between items-start mb-4">
							<div class="flex-1 mr-2">
								{#if editingId === planet.id}
									<div class="flex gap-2">
										<input 
											type="text" 
											class="input input-sm input-bordered w-full max-w-xs bg-black/50 text-white" 
											bind:value={editName}
											on:keydown={(e) => e.key === 'Enter' && saveName(planet.id)}
											autoFocus
										/>
										<button class="btn btn-sm btn-success btn-square" on:click={() => saveName(planet.id)}>✓</button>
										<button class="btn btn-sm btn-ghost btn-square" on:click={cancelEdit}>✕</button>
									</div>
								{:else}
									<div class="flex items-center gap-2 group/title">
										<h2 class="text-xl font-bold text-white font-display truncate" title={planet.name}>{planet.name}</h2>
										<button 
											class="btn btn-xs btn-ghost opacity-0 group-hover/title:opacity-100 transition-opacity text-slate-400 hover:text-white"
											on:click={() => startEdit(planet)}
											title="Rename Planet"
										>
											✎
										</button>
									</div>
								{/if}
								<div class="text-sm text-slate-400 font-mono mt-1">
									[{planet.systemId}:{planet.orbitIndex}] {planet.systemName}
								</div>
							</div>
							<div class="badge badge-outline border-white/20 text-xs uppercase tracking-wider text-slate-300">
								{planet.type}
							</div>
						</div>

						<div class="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
							<div class="text-xs text-slate-500">
								Coords: {planet.x}, {planet.y}
							</div>
							<a 
								href="/base?planetId={planet.id}" 
								class="btn btn-sm bg-neon-blue text-black border-neon-blue hover:bg-neon-blue/80 hover:border-neon-blue font-bold shadow-[0_0_10px_rgba(0,243,255,0.3)]"
							>
								Manage Base
							</a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
