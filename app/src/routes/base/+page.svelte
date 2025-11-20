<script lang="ts">
	import { onMount } from 'svelte';
	import { BUILDING_DATA, RESEARCH_DATA } from '$lib/data/gameData';
	import BuildingIcon from '$lib/icons/BuildingIcon.svelte';
	let state: any = null;
	let error = '';
	let upgrading = new Set<string>();

	// UI modal state for building details
	let selectedBuilding: string | null = null;
	let showModal = false;

	// BuildingIcon component provides consistent SVG icons for buildings

	// format requirement objects into human-friendly lines
	function formatRequirements(req: any) {
		if (!req) return ['None'];
		const lines: string[] = [];
		if (req.building) {
			const name = (BUILDING_DATA as any)[req.building]?.name ?? req.building;
			lines.push(`${name} — level ≥ ${req.level ?? 1}`);
		}
		if (req.research) {
			const rname = (RESEARCH_DATA as any)[req.research]?.name ?? req.research;
			lines.push(`Research: ${rname} — level ≥ ${req.level ?? 1}`);
		}
		if (Object.keys(req).length === 0) return ['None'];
		return lines.length ? lines : [JSON.stringify(req)];
	}

	function openBuilding(id: string) {
		selectedBuilding = id;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		selectedBuilding = null;
	}

	// computed helper used by modal template
	$: nextLevel = selectedBuilding ? (state?.buildings?.[selectedBuilding] ?? 0) + 1 : 1;
	$: resources = state?.resources ?? { metal: 0, crystal: 0, fuel: 0, credits: 0 };
	$: upgradeCost = selectedBuilding ? BUILDING_DATA[selectedBuilding]?.cost?.(nextLevel) : null;
	$: canAffordUpgrade =
		selectedBuilding && upgradeCost
			? resources.metal >= (upgradeCost.metal ?? 0) &&
				resources.crystal >= (upgradeCost.crystal ?? 0)
			: false;
	$: metalMineLevel = state?.buildings?.metalMine ?? 0;
	$: crystalSynthesizerLevel = state?.buildings?.crystalSynthesizer ?? 0;
	$: metalProductionRate = BUILDING_DATA.metalMine.production?.(metalMineLevel) ?? 0;
	$: crystalProductionRate =
		BUILDING_DATA.crystalSynthesizer.production?.(crystalSynthesizerLevel) ?? 0;

	$: buildingsByCategory = Object.entries(BUILDING_DATA).reduce(
		(acc, [id, def]) => {
			const category = def.category || 'Other';
			if (!acc[category]) acc[category] = [];
			acc[category].push({ id, ...def });
			return acc;
		},
		{} as Record<string, any[]>
	);

	$: categories = Object.keys(buildingsByCategory).sort();

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

	async function processBuilds() {
		const res = await fetch('/api/shipyard/process', { method: 'POST' });
		if (res.ok) {
			const b = await res.json();
			await new Promise((r) => setTimeout(r, 200));
			const r2 = await fetch('/api/player/state');
			state = (await r2.json()).state;
			// notify other UI parts (like ResourceBar) to reload their state
			try {
				window.dispatchEvent(new CustomEvent('player:changed'));
			} catch (e) {}
		} else {
			error = 'process_failed';
		}
	}

	async function upgradeBuilding(id: string) {
		if (upgrading.has(id)) return;
		upgrading.add(id);
		const res = await fetch('/api/demo/buildings/upgrade', {
			method: 'POST',
			body: JSON.stringify({ buildingId: id }),
			headers: { 'Content-Type': 'application/json' }
		});
		if (res.ok) {
			state = (await res.json()).state;
			// tell other components to reload their player state (ResourceBar)
			try {
				window.dispatchEvent(new CustomEvent('player:changed'));
			} catch (e) {}
			import('$lib/stores/toast').then((m) =>
				m.pushToast(`${BUILDING_DATA[id].name} upgrade queued`, 'success')
			);
		} else {
			import('$lib/stores/toast').then((m) => m.pushToast(`Upgrade failed`, 'error'));
		}
		upgrading.delete(id);
	}
</script>

{#if error}
	<div class="alert alert-warning">
		<div>
			<span>{error} —</span>
			<a class="link" href="/login"> login</a>
			<span> or </span>
			<a class="link" href="/register">register</a>
		</div>
	</div>
{:else if !state}
	<div class="flex justify-center"><progress class="progress w-56"></progress></div>
{:else}
	<div class="container mx-auto p-4">
		<div class="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
			<div class="glass-panel p-6 rounded-xl">
				<h3 class="text-xl font-display font-bold text-neon-blue tracking-wide">Commander: {state.username}</h3>
				<p class="text-slate-400 text-sm mt-1">Colony: <span class="text-white">{state.username} Prime</span> <span class="text-neon-blue font-mono ml-2">[{state.homeSystem ?? 1}:{state.homePlanet ?? 1}] {state.systemName ?? ''}</span></p>
				<p class="text-slate-400 text-sm mt-1">Level: <span class="text-white">{state.level}</span> · Power: <span class="text-white">{state.power}</span></p>
				<div class="divider my-4 before:bg-white/10 after:bg-white/10"></div>
				<h4 class="font-medium text-slate-200 mb-2">Resources</h4>
				<ul class="mt-2 space-y-2">

					<li class="badge badge-outline border-slate-500/50 text-slate-200 w-full justify-start gap-2 p-3">Metal: <span class="font-bold text-white ml-auto">{resources.metal}</span> <span class="text-xs text-success">(+{metalProductionRate}/hr)</span></li>
					<li class="badge badge-outline border-cyan-500/50 text-cyan-200 w-full justify-start gap-2 p-3">
						Crystal: <span class="font-bold text-white ml-auto">{resources.crystal}</span> <span class="text-xs text-success">(+{crystalProductionRate}/hr)</span>
					</li>
					<li class="badge badge-outline border-emerald-500/50 text-emerald-200 w-full justify-start gap-2 p-3">Fuel: <span class="font-bold text-white ml-auto">{resources.fuel}</span></li>
				</ul>
			</div>

			<div class="glass-panel col-span-2 p-6 rounded-xl">
				<div class="flex items-center justify-between">
					<h3 class="text-xl font-display font-bold text-neon-blue tracking-wide">Fleet Status</h3>
				</div>
				<div class="divider my-4 before:bg-white/10 after:bg-white/10"></div>
				{#if state.ships && state.ships.length > 0}
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{#each state.ships as s}
							<div class="p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between group">
								<div>
									<div class="font-medium text-slate-200 group-hover:text-neon-blue transition-colors">{s.shipTemplateId}</div>
									<div class="text-slate-400 text-xs">Active Units</div>
								</div>
								<div>
									<span class="badge badge-info bg-neon-blue/20 border-neon-blue/50 text-neon-blue">x{s.quantity}</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-slate-500 italic">No ships in fleet.</p>
				{/if}
			</div>
		</div>

		<div>
			<h3 class="mb-4 text-2xl font-bold">Base Buildings</h3>
			{#each categories as category}
				<h4 class="mt-4 mb-2 text-xl font-semibold">{category}</h4>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{#each buildingsByCategory[category] as building}
						<div
							class="glass-panel cursor-pointer rounded-xl transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,243,255,0.15)] border border-white/5 group"
							role="button"
							tabindex="0"
							on:click={() => openBuilding(building.id)}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									openBuilding(building.id);
								}
							}}
						>
							<div class="p-5">
								<div class="flex items-center gap-4">
									<div class="text-4xl text-neon-blue group-hover:text-neon-purple transition-colors duration-300 drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]">
										<BuildingIcon id={building.id} className="text-4xl" />
									</div>
									<div>
										<h4 class="text-lg font-bold font-display text-slate-100 group-hover:text-white transition-colors">{building.name}</h4>
										<p class="text-slate-400 text-sm">Level <span class="text-neon-blue font-mono">{state.buildings?.[building.id] ?? 0}</span></p>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if showModal && selectedBuilding}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		on:click={closeModal}
		on:keydown={(e) => e.key === 'Escape' && closeModal()}
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="w-11/12 max-w-2xl rounded-xl glass-panel p-6 shadow-2xl border border-white/10"
			role="document"
			tabindex="-1"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="flex items-start justify-between">
				<div class="flex items-center gap-4">
					<div class="text-5xl text-neon-blue drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
						<BuildingIcon id={selectedBuilding!} className="text-5xl" />
					</div>
					<div>
						<h3 class="text-2xl font-bold font-display text-white tracking-wide">{BUILDING_DATA[selectedBuilding].name}</h3>
						<p class="text-md text-slate-400">
							Level <span class="text-neon-blue font-mono">{state.buildings?.[selectedBuilding] ?? 0}</span>
						</p>
					</div>
				</div>
				<button class="btn btn-ghost btn-sm text-white/50 hover:text-white" on:click={closeModal}>✕</button>
			</div>
			<div class="divider my-4 before:bg-white/10 after:bg-white/10"></div>
			<p class="mb-4 text-lg text-slate-200">{BUILDING_DATA[selectedBuilding].description}</p>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<h4 class="mb-2 text-xl font-semibold text-neon-blue font-display">Benefit</h4>
					<p class="text-md text-slate-300">
						{typeof BUILDING_DATA[selectedBuilding!].benefit === 'function'
							? (BUILDING_DATA[selectedBuilding!].benefit as any)(
									state.buildings?.[selectedBuilding!] ?? 0
								)
							: BUILDING_DATA[selectedBuilding!].benefit}
					</p>
				</div>
				<div>
					<h4 class="mb-2 text-xl font-semibold text-neon-blue font-display">Requirements</h4>
					<div class="text-md text-slate-300">
						<ul class="list-inside list-disc marker:text-neon-blue">
							{#each formatRequirements(BUILDING_DATA[selectedBuilding].requires ?? {}) as line}
								<li>{line}</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
			<div class="divider my-4 before:bg-white/10 after:bg-white/10"></div>
			<div>
				<h4 class="mb-2 text-xl font-semibold text-white font-display">Upgrade to Level {nextLevel}</h4>
				<div class="flex items-center justify-between">
					<div>
						{#if BUILDING_DATA[selectedBuilding!].cost}
							<div class="flex items-center gap-4">
								<div>
									<p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Cost:</p>
									<div class="mt-1 flex gap-2">
										{#each Object.entries(BUILDING_DATA[selectedBuilding!].cost?.(nextLevel) ?? {}) as [res, amt]}
											<div class="badge badge-outline border-white/20 text-slate-200">
												{res}: <span class="ml-1 font-bold text-white" class:text-error={(resources[res] ?? 0) < amt}>{amt}</span>
											</div>
										{/each}
									</div>
								</div>
								<div>
									<p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Time:</p>
									<p class="mt-1 text-slate-200 font-mono">
										{BUILDING_DATA[selectedBuilding!].time
											? (BUILDING_DATA as any)[selectedBuilding!].time(nextLevel) + 's'
											: '—'}
									</p>
								</div>
							</div>
						{:else}
							<p class="text-md text-slate-400">No cost data</p>
						{/if}
					</div>
					<div class="flex flex-col items-end gap-2">
						<button
							class="btn btn-lg bg-neon-blue text-black border-neon-blue hover:bg-neon-blue/80 hover:border-neon-blue font-bold tracking-wide shadow-[0_0_15px_rgba(0,243,255,0.4)]"
							disabled={!canAffordUpgrade}
							on:click={() => {
								upgradeBuilding(selectedBuilding!);
								closeModal();
							}}>Upgrade</button
						>
						{#if !canAffordUpgrade}
							<div class="text-error text-xs font-bold">Insufficient resources</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
