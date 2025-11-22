<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';

	export let fleets: any[] = [];
	
	function formatTime(seconds: number) {
		if (seconds < 0) return '00:00:00';
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	function getMissionColor(mission: string) {
		switch (mission) {
			case 'attack': return 'text-red-400';
			case 'transport': return 'text-green-400';
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
		<div class="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-white/10">
			{#each fleets as fleet (fleet.id)}
				<div class="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors" transition:slide>
					<div class="flex justify-between items-start mb-2">
						<div class="flex items-center gap-2">
							<span class="text-lg">{getMissionIcon(fleet.mission)}</span>
							<div>
								<div class="font-bold text-sm uppercase tracking-wider {getMissionColor(fleet.mission)}">
									{fleet.mission}
								</div>
								<div class="text-xs text-slate-400">
									Target: {fleet.targetSystem}:{fleet.targetPlanet}
								</div>
							</div>
						</div>
						<div class="text-right">
							<div class="font-mono text-sm font-bold text-white">
								{formatTime(fleet.etaSeconds)}
							</div>
							<div class="text-[10px] text-slate-500 uppercase">
								{fleet.status}
							</div>
						</div>
					</div>

					<!-- Composition Preview -->
					<div class="flex flex-wrap gap-1 mt-2">
						{#each Object.entries(fleet.composition || {}) as [shipId, count]}
							<div class="badge badge-xs badge-ghost gap-1 text-[10px] border-white/10">
								<span>{count}</span>
								<span class="opacity-70">{shipId}</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
