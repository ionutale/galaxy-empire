<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';

	export let fleets: any[] = [];
	
	let now = Date.now();

	onMount(() => {
		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(interval);
	});

	function formatTime(seconds: number) {
		if (seconds < 0) return '00:00:00';
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	function getEta(fleet: any) {
		if (!fleet.arrivalTime) return 'Unknown';
		const arrival = new Date(fleet.arrivalTime).getTime();
		const seconds = Math.max(0, Math.floor((arrival - now) / 1000));
		return formatTime(seconds);
	}

	function getMissionColor(mission: string) {
		switch (mission) {
			case 'attack': return 'text-red-400';
			case 'transport': return 'text-emerald-400';
			case 'espionage': return 'text-yellow-400';
			case 'colonize': return 'text-blue-400';
			case 'recycle': return 'text-purple-400';
			default: return 'text-white';
		}
	}

	function getMissionIcon(mission: string) {
		switch (mission) {
			case 'attack': return '⚔️';
			case 'transport': return '📦';
			case 'espionage': return '🕵️';
			case 'colonize': return '🏳️';
			case 'recycle': return '♻️';
			default: return '🚀';
		}
	}
</script>

<div class="h-full flex flex-col p-4 gap-4">
	<h2 class="text-xl font-bold text-neon-blue flex items-center gap-2">
		<span>🚀</span> Fleet Movements
	</h2>

	{#if fleets.length === 0}
		<div class="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50">
			<span class="text-4xl mb-2">🌌</span>
			<p>No active fleets</p>
		</div>
	{:else}
		<div class="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-white/10 pr-2">
			{#each fleets as fleet (fleet.id)}
				<div class="relative overflow-hidden rounded-lg bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition-colors group" transition:slide>
					<div class="flex justify-between items-start mb-2">
						<div class="flex items-center gap-2">
							<span class="text-lg">{getMissionIcon(fleet.mission)}</span>
							<div>
								<div class="font-bold text-sm uppercase tracking-wider {getMissionColor(fleet.mission)}">
									{fleet.mission}
								</div>
								<div class="text-xs text-slate-400">
									Target: <span class="text-white font-mono">{fleet.targetSystem}:{fleet.targetPlanet}</span>
								</div>
							</div>
						</div>
						<div class="text-right">
							<div class="font-mono text-sm font-bold text-white">
								{getEta(fleet)}
							</div>
							<div class="text-[10px] text-slate-500 uppercase tracking-widest">
								{fleet.status}
							</div>
						</div>
					</div>

					<!-- Composition Preview -->
					{#if fleet.composition && Object.keys(fleet.composition).length > 0}
						<div class="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/5">
							{#each Object.entries(fleet.composition) as [shipId, count]}
								<div class="badge badge-xs badge-ghost gap-1 text-[10px] border-white/10 bg-black/30">
									<span class="font-mono text-neon-blue">{count}</span>
									<span class="opacity-70">{shipId}</span>
								</div>
							{/each}
						</div>
					{/if}
					
					<!-- Progress Bar (Approximate based on status) -->
					{#if fleet.status === 'active'}
						<div class="absolute bottom-0 left-0 h-0.5 w-full bg-white/5">
							<div class="h-full bg-neon-blue/30 w-1/2 animate-pulse"></div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
