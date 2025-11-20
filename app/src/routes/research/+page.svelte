<script lang="ts">
	import { onMount } from 'svelte';
	import { RESEARCH_DATA } from '$lib/data/gameData';

	let loading = true;
	let starting = new Set<string>();
	let playerState: any = null;
	let techs: any[] = [];

	async function load() {
		loading = true;
		try {
			const [lRes, pRes] = await Promise.all([
				fetch('/api/demo/research/list'),
				fetch('/api/player/state')
			]);

			if (lRes.ok) techs = (await lRes.json()).techs;
			if (pRes.ok) {
				const body = await pRes.json();
				// Merge research levels from player.json (which might be in body.state.research or body.state.player.research depending on how state endpoint is built)
				// The state endpoint returns { state: { ... } }
				// We need to check where research levels are.
				// In api/player/state/+server.ts, it returns `buildings` but not explicit `research` object from DB.
				// However, it does return `builds`.
				// Wait, `api/player/state` reads from `player.json` fallback if DB fails, but if DB works, it constructs state.
				// The current `api/player/state` implementation DOES NOT return research levels from DB because there is no research table query there yet.
				// But `processResearch` writes to `player.json`.
				// So we might need to fetch `player.json` content or update `api/player/state` to include research.
				// Let's assume for now we can get it from `player.json` via a separate call or if `api/player/state` returns it.
				// Actually, let's check `api/player/state` again.
				playerState = body.state;

				// If research is missing in state (because it's not in DB yet), we might need to fetch it from demo storage or just rely on what we have.
				// For the demo, let's try to fetch the full player dump if needed, or just assume it's in `state` if the backend puts it there.
				// The `api/player/state` I read earlier did NOT include research.
				// I should probably update `api/player/state` to include research from `player.json` or DB.
				// But for now, let's fetch it from `api/demo/player` if it exists, or just use `api/player/state` and maybe I need to patch `api/player/state` first.
			}
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	// We need to fetch research levels. Since `api/player/state` doesn't return them, let's create a quick way or patch `api/player/state`.
	// Patching `api/player/state` is better.

	onMount(load);

	async function start(tid: string) {
		if (starting.has(tid)) return;
		starting.add(tid);
		const res = await fetch('/api/demo/research/start', {
			method: 'POST',
			body: JSON.stringify({ techId: tid }),
			headers: { 'Content-Type': 'application/json' }
		});
		if (res.ok) {
			window.dispatchEvent(new CustomEvent('player:changed'));
			await load();
			import('$lib/stores/toast').then((m) => m.pushToast(`Research started`, 'success'));
		} else {
			const err = await res.json();
			import('$lib/stores/toast').then((m) => m.pushToast(err.error || `Research failed`, 'error'));
		}
		starting.delete(tid);
	}

	function getLevel(tid: string) {
		// Try to find level in playerState.research (if we add it) or default to 0
		// We need to ensure playerState has research.
		return playerState?.research?.[tid]?.level || 0;
	}

	function canAfford(tid: string, level: number) {
		if (!playerState?.resources) return false;
		const def = (RESEARCH_DATA as any)[tid];
		if (!def || !def.cost) return true;
		const cost = def.cost(level + 1);
		const r = playerState.resources;
		return (
			r.credits >= (cost.credits || 0) &&
			r.metal >= (cost.metal || 0) &&
			r.crystal >= (cost.crystal || 0) &&
			r.fuel >= (cost.fuel || cost.deuterium || 0)
		);
	}
</script>

<div class="p-4">
	<h2 class="mb-4 text-2xl font-bold">Research Lab</h2>

	{#if loading}
		<div class="flex justify-center"><progress class="progress w-56"></progress></div>
	{:else}
		{#if !playerState?.buildings?.researchLab}
			<div class="mb-4 alert alert-warning">
				<span>You need to build a Research Lab to conduct research.</span>
			</div>
		{/if}

		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{#each techs as t}
				{@const level = getLevel(t.id)}
				{@const def = (RESEARCH_DATA as any)[t.id]}
				{@const nextLevel = level + 1}
				{@const cost = def?.cost ? def.cost(nextLevel) : {}}
				{@const affordable = canAfford(t.id, level)}
				{@const time = def?.time ? def.time(nextLevel) : 0}

				<div class="card border border-base-300 bg-base-100 shadow-lg">
					<div class="card-body">
						<div class="flex items-start justify-between">
							<div>
								<h3 class="card-title text-lg">
									{t.name}
									<span class="ml-2 badge badge-neutral">Lvl {level}</span>
								</h3>
								<p class="text-muted mt-1 text-sm">{t.description}</p>
							</div>
							<div class="text-right text-xs opacity-70">
								{time}s
							</div>
						</div>

						<div class="divider my-2"></div>

						<div class="mb-4 grid grid-cols-2 gap-2 text-sm">
							{#if cost.credits}
								<div class="flex justify-between">
									<span class="opacity-70">Credits:</span>
									<span
										class={(playerState?.resources?.credits ?? 0) < cost.credits
											? 'font-bold text-error'
											: ''}>{cost.credits}</span
									>
								</div>
							{/if}
							{#if cost.metal}
								<div class="flex justify-between">
									<span class="opacity-70">Metal:</span>
									<span
										class={(playerState?.resources?.metal ?? 0) < cost.metal
											? 'font-bold text-error'
											: ''}>{cost.metal}</span
									>
								</div>
							{/if}
							{#if cost.crystal}
								<div class="flex justify-between">
									<span class="opacity-70">Crystal:</span>
									<span
										class={(playerState?.resources?.crystal ?? 0) < cost.crystal
											? 'font-bold text-error'
											: ''}>{cost.crystal}</span
									>
								</div>
							{/if}
							{#if cost.fuel || cost.deuterium}
								<div class="flex justify-between">
									<span class="opacity-70">Fuel:</span>
									<span
										class={(playerState?.resources?.fuel ?? 0) < (cost.fuel || cost.deuterium)
											? 'font-bold text-error'
											: ''}>{cost.fuel || cost.deuterium}</span
									>
								</div>
							{/if}
						</div>

						<div class="card-actions justify-end">
							<button
								class="btn btn-sm btn-primary"
								disabled={!affordable || !playerState?.buildings?.researchLab}
								on:click={() => start(t.id)}
							>
								{level === 0 ? 'Start Research' : 'Upgrade'}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
