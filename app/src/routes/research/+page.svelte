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

	function getCost(id: string, level: number) {
		const def = RESEARCH_DATA[id as keyof typeof RESEARCH_DATA];
		return def.cost ? def.cost(level + 1) : {};
	}

	function getTime(id: string, level: number) {
		const def = RESEARCH_DATA[id as keyof typeof RESEARCH_DATA];
		return def.time ? def.time(level + 1) : 60;
	}

	function canAfford(cost: any) {
		if (!state) return false;
		return (
			state.metal >= (cost.metal || 0) &&
			state.crystal >= (cost.crystal || 0) &&
			state.fuel >= (cost.deuterium || 0) &&
			state.credits >= (cost.credits || 0)
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
				
				<div class="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow">
					<div class="card-body">
						<div class="flex items-start justify-between">
							<div class="flex items-center gap-3">
								<div class="text-primary">
									<ResearchIcon {id} className="w-10 h-10" />
								</div>
								<div>
									<h2 class="card-title">{def.name}</h2>
									<div class="badge badge-outline">Level {level}</div>
								</div>
							</div>
						</div>
						
						<p class="text-sm text-muted mt-2 h-10 overflow-hidden">{def.description}</p>
						
						<div class="divider my-2"></div>
						
						<div class="text-sm">
							<div class="font-semibold mb-1">Next Level Effect:</div>
							<div class="text-secondary">
								{typeof def.effect === 'function' ? def.effect(level + 1) : def.effect}
							</div>
						</div>

						<div class="mt-4">
							<div class="font-semibold text-xs uppercase text-muted mb-1">Cost</div>
							<div class="flex flex-wrap gap-2">
								{#if cost.metal}<span class="badge badge-neutral text-xs">Metal: {cost.metal}</span>{/if}
								{#if cost.crystal}<span class="badge badge-secondary text-xs">Crystal: {cost.crystal}</span>{/if}
								{#if cost.deuterium}<span class="badge badge-accent text-xs">Fuel: {cost.deuterium}</span>{/if}
								{#if cost.credits}<span class="badge badge-ghost text-xs">Credits: {cost.credits}</span>{/if}
							</div>
							<div class="text-xs text-muted mt-1">Time: {time}s</div>
						</div>

						<div class="card-actions justify-end mt-4">
							<button 
								class="btn btn-primary btn-sm" 
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
