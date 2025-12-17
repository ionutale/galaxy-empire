<script lang="ts">
	import { fade } from 'svelte/transition';
	import PlanetVisual from './PlanetVisual.svelte';

	export let systems: any[] = [];
	export let activeSystemId: string | null = null;
	export let userId: string;

	// Helper to calculate distance (optional, if needed for display)
	function getDistance(s1: any, s2: any) {
		const dx = s1.x - s2.x;
		const dy = s1.y - s2.y;
		return Math.sqrt(dx * dx + dy * dy).toFixed(1);
	}
	
	$: userHomeSystem = systems.find(s => s.planets.some((p: any) => p.ownerId === userId))?.id;

	let selectedPlanets: Record<number, any> = {};

	function selectPlanet(sysId: number, planet: any) {
		selectedPlanets[sysId] = planet;
		selectedPlanets = selectedPlanets; // trigger reactivity
	}

	function getPlanetStyle(type: string) {
		if (type === 'nebula') return 'bg-black shadow-[0_0_15px_#a855f7] border-purple-500/50';
		return '';
	}
</script>

<div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto h-[calc(100vh-6rem)] scrollbar-thin scrollbar-thumb-white/10">
	{#each systems as sys (sys.id)}
		<div class="glass-panel-unified relative group hover:border-neon-blue/50 transition-all duration-300"
			 class:border-neon-blue={sys.id === userHomeSystem}
			 class:shadow-[0_0_15px_rgba(0,243,255,0.2)]={sys.id === userHomeSystem}>
			
			<!-- Header -->
			<div class="flex justify-between items-start mb-4 border-b border-white/10 pb-3">
				<div>
					<h3 class="text-xl font-bold font-display text-white tracking-wide flex items-center gap-2">
						{sys.name}
						{#if sys.id === userHomeSystem}
							<span class="badge badge-sm badge-info gap-1">
								🏠 Home
							</span>
						{/if}
					</h3>
					<div class="text-xs font-mono text-slate-400 mt-1">
						COORDS: <span class="text-neon-blue">[{sys.x}, {sys.y}]</span>
					</div>
				</div>
				<div class="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
					🌌
				</div>
			</div>

			<!-- Planets Grid -->
			<div class="mb-6">
				<div class="text-xs text-slate-500 uppercase tracking-wider mb-2">
					System Objects ({sys.planets.length})
					{#if selectedPlanets[sys.id]}
						<span class="text-neon-blue ml-2">- Selected: {selectedPlanets[sys.id].name}</span>
					{/if}
				</div>
				<div class="grid grid-cols-4 gap-2">
					{#each sys.planets as planet}
						<button 
							class="tooltip relative aspect-square rounded-lg border flex items-center justify-center transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-neon-blue"
							class:border-white-5={selectedPlanets[sys.id]?.id !== planet.id}
							class:bg-white-5={selectedPlanets[sys.id]?.id !== planet.id}
							class:border-neon-blue={selectedPlanets[sys.id]?.id === planet.id}
							class:bg-white-10={selectedPlanets[sys.id]?.id === planet.id}
							class:ring-2={selectedPlanets[sys.id]?.id === planet.id}
							class:ring-neon-blue={selectedPlanets[sys.id]?.id === planet.id}
							data-tip="{planet.name} ({planet.type})"
							on:click={() => selectPlanet(sys.id, planet)}
						>
							{#if planet.type === 'nebula'}
								<!-- Nebula / Black Hole Visual -->
								<div class="w-full h-full absolute inset-0 bg-black">
									<div class="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-purple-500/50 via-black to-black animate-pulse"></div>
									<div class="absolute inset-1 rounded-full border border-purple-500/30 shadow-[0_0_10px_#a855f7]"></div>
									<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
								</div>
							{:else}
								<div class="w-8 h-8 transition-transform duration-300 hover:scale-110">
									<PlanetVisual type={planet.type} />
								</div>
								{#if planet.ownerId && planet.ownerId !== userId}
									<div class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-bl-md shadow-[0_0_5px_red]"></div>
								{:else if planet.ownerId === userId}
									<div class="absolute top-0 right-0 w-2 h-2 bg-neon-blue rounded-bl-md shadow-[0_0_5px_#00f3ff]"></div>
								{/if}
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<!-- Actions -->
			<div class="flex gap-2 mt-auto">
				<a href="/fleet/dispatch?targetSystem={sys.id}&planet={selectedPlanets[sys.id]?.orbitIndex || 1}" 
				   class="btn btn-sm flex-1 bg-white/5 border-white/10 hover:bg-neon-blue hover:text-black hover:border-neon-blue transition-all group-hover:bg-white/10"
				   class:btn-disabled={selectedPlanets[sys.id]?.type === 'nebula'}>
					Dispatch Fleet
				</a>
				<a href="/fleet/dispatch?targetSystem={sys.id}&planet={selectedPlanets[sys.id]?.orbitIndex || 1}&mission=spy" 
				   class="btn btn-sm bg-white/5 border-white/10 hover:bg-yellow-400 hover:text-black hover:border-yellow-400 transition-all group-hover:bg-white/10"
				   class:btn-disabled={selectedPlanets[sys.id]?.type === 'nebula'}
				   title="Spy Mission">
					👁️
				</a>
				{#if selectedPlanets[sys.id]?.type === 'nebula'}
					<a href="/fleet/dispatch?targetSystem={sys.id}&planet={selectedPlanets[sys.id]?.orbitIndex}&mission=explore" 
					   class="btn btn-sm bg-purple-500/20 border-purple-500/50 text-purple-300 hover:bg-purple-400 hover:text-black hover:border-purple-400 transition-all"
					   title="Explore Nebula">
						🌫️ Explore
					</a>
				{/if}
			</div>
		</div>
	{/each}
</div>
