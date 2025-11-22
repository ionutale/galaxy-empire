<script lang="ts">
	import { onMount } from 'svelte';
	import { RESEARCH_DATA } from '$lib/data/gameData';
	import ResearchIcon from '$lib/icons/ResearchIcon.svelte';
	import { fade } from 'svelte/transition';

	let state: any = null;
	let error = '';
	let researching = new Set<string>();

	onMount(() => {
		(async () => {
			const res = await fetch('/api/player/state');
			if (res.ok) {
				const body = await res.json();
				state = body.state;
			} else {
				error = 'unauthenticated';
			}
		})();
	});

	async function startResearch(id: string) {
		if (researching.has(id)) return;
		researching.add(id);
		const res = await fetch('/api/research/start', {
			method: 'POST',
			body: JSON.stringify({ techId: id }),
			headers: { 'Content-Type': 'application/json' }
		});
		if (res.ok) {
			// Reload state
			const r2 = await fetch('/api/player/state');
			state = (await r2.json()).state;
			
			// Notify toast
			import('$lib/stores/toast').then((m) =>
				m.pushToast(`${RESEARCH_DATA[id as keyof typeof RESEARCH_DATA].name} started`, 'success')
			);
		} else {
			const err = await res.json();
			import('$lib/stores/toast').then((m) => 
				m.pushToast(`Research failed: ${err.error}`, 'error')
			);
		}
		researching.delete(id);
	}

	function getLevel(id: string) {
		return state?.research?.[id]?.level ?? 0;
	}

	function getCost(id: string, level: number): any {
		const def = RESEARCH_DATA[id as keyof typeof RESEARCH_DATA];
		return def.cost ? def.cost(level + 1) : {};
	}

	function getTime(id: string, level: number) {
		const def = RESEARCH_DATA[id as keyof typeof RESEARCH_DATA];
		return def.time ? def.time(level + 1) : 60;
	}

	function canAfford(cost: any) {
		if (!state || !state.resources) return false;
		return (
			state.resources.metal >= (cost.metal || 0) &&
			state.resources.crystal >= (cost.crystal || 0) &&
			state.resources.fuel >= (cost.deuterium || 0) &&
			state.resources.credits >= (cost.credits || 0)
		);
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-6 text-primary">Research Center</h1>

	{#if error}
		<div class="alert alert-error">{error}</div>
	{:else if !state}
		<div class="flex justify-center"><span class="loading loading-spinner loading-lg"></span></div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each Object.entries(RESEARCH_DATA) as [id, def]}
				{@const level = getLevel(id)}
				{@const cost = getCost(id, level)}
				{@const time = getTime(id, level)}
				{@const affordable = canAfford(cost)}
				
				<div class="glass-panel p-0 rounded-xl overflow-hidden border border-white/10 hover:border-neon-purple/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] group">
					<div class="p-5">
						<div class="flex items-start justify-between">
							<div class="flex items-center gap-4">
								<div class="text-neon-purple drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform duration-300">
									<ResearchIcon {id} className="w-12 h-12" />
								</div>
								<div>
									<h2 class="text-lg font-bold font-display text-white group-hover:text-neon-purple transition-colors">{def.name}</h2>
									<div class="badge badge-sm border-neon-purple/30 text-neon-purple bg-neon-purple/10 mt-1">Level {level}</div>
								</div>
							</div>
						</div>
						
						<p class="text-sm text-slate-400 mt-3 h-10 overflow-hidden leading-relaxed">{def.description}</p>
						
						<div class="divider my-3 before:bg-white/10 after:bg-white/10"></div>
						
						<div class="text-sm bg-white/5 rounded-lg p-3 border border-white/5">
							<div class="font-semibold mb-1 text-slate-300 text-xs uppercase tracking-wide">Next Level Effect</div>
							<div class="text-neon-blue font-mono text-xs">
								{typeof def.effect === 'function' ? def.effect(level + 1) : def.effect}
							</div>
						</div>

						<div class="mt-4">
							<div class="font-semibold text-xs uppercase text-slate-500 mb-2 tracking-wider">Required Resources</div>
							<div class="flex flex-wrap gap-2">
								{#if cost.metal}<span class="badge badge-outline border-slate-500 text-slate-300 text-xs">Metal: {cost.metal}</span>{/if}
								{#if cost.crystal}<span class="badge badge-outline border-cyan-500/50 text-cyan-200 text-xs">Crystal: {cost.crystal}</span>{/if}
								{#if cost.deuterium}<span class="badge badge-outline border-emerald-500/50 text-emerald-200 text-xs">Fuel: {cost.deuterium}</span>{/if}

							</div>
							<div class="text-xs text-slate-500 mt-2 font-mono text-right">Time: <span class="text-white">{time}s</span></div>
						</div>

						<div class="mt-4 flex justify-end">
							<button 
								class="btn btn-sm bg-neon-purple text-black border-neon-purple hover:bg-neon-purple/80 hover:border-neon-purple font-bold tracking-wide shadow-[0_0_10px_rgba(168,85,247,0.3)] disabled:bg-white/5 disabled:text-white/20 disabled:border-transparent w-full" 
								disabled={!affordable || researching.has(id)}
								on:click={() => startResearch(id)}
							>
								{#if researching.has(id)}
									<span class="loading loading-spinner loading-xs"></span>
								{:else}
									Research
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
