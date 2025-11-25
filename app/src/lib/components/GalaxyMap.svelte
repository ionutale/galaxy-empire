<script lang="ts">
	import { fade } from 'svelte/transition';

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
				<div class="text-xs text-slate-500 uppercase tracking-wider mb-2">Planets Detected ({sys.planets.length})</div>
				<div class="grid grid-cols-4 gap-2">
					{#each sys.planets as planet}
						<div class="tooltip" data-tip="{planet.name} ({planet.type})">
							<div class="aspect-square rounded-lg bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative overflow-hidden">
								<div class="w-3 h-3 rounded-full shadow-[0_0_5px_currentColor]" 
									class:text-blue-400={planet.type==='ocean'} class:bg-blue-400={planet.type==='ocean'}
									class:text-green-500={planet.type==='terrestrial'} class:bg-green-500={planet.type==='terrestrial'}
									class:text-red-500={planet.type==='lava'} class:bg-red-500={planet.type==='lava'}
									class:text-cyan-200={planet.type==='ice'} class:bg-cyan-200={planet.type==='ice'}
									class:text-orange-300={planet.type==='gas_giant'} class:bg-orange-300={planet.type==='gas_giant'}
									class:text-yellow-200={planet.type==='desert'} class:bg-yellow-200={planet.type==='desert'}
									class:text-gray-400={planet.type==='barren'} class:bg-gray-400={planet.type==='barren'}>
								</div>
								{#if planet.ownerId && planet.ownerId !== userId}
									<div class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-bl-md"></div>
								{:else if planet.ownerId === userId}
									<div class="absolute top-0 right-0 w-2 h-2 bg-neon-blue rounded-bl-md"></div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Actions -->
			<div class="flex gap-2 mt-auto">
				<a href="/fleet/dispatch?targetSystem={sys.id}&planet=1" 
				   class="btn btn-sm flex-1 bg-white/5 border-white/10 hover:bg-neon-blue hover:text-black hover:border-neon-blue transition-all group-hover:bg-white/10">
					Dispatch Fleet
				</a>
				<a href="/fleet/dispatch?targetSystem={sys.id}&planet=1&mission=spy" 
				   class="btn btn-sm bg-white/5 border-white/10 hover:bg-yellow-400 hover:text-black hover:border-yellow-400 transition-all group-hover:bg-white/10"
				   title="Spy Mission">
					👁️
				</a>
			</div>
		</div>
	{/each}
</div>
