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
			<div class="card bg-base-200 p-4">
				<h3 class="text-lg font-semibold">Commander: {state.username}</h3>
				<p class="text-muted text-sm">Level: {state.level} · Power: {state.power}</p>
				<div class="divider"></div>
				<h4 class="font-medium">Resources</h4>
				<ul class="mt-2 space-y-1">
					<li class="badge badge-outline">Credits: {resources.credits}</li>
					<li class="badge badge-outline">Metal: {resources.metal} (+{metalProductionRate}/hr)</li>
					<li class="badge badge-outline">
						Crystal: {resources.crystal} (+{crystalProductionRate}/hr)
					</li>
					<li class="badge badge-outline">Fuel: {resources.fuel}</li>
				</ul>
			</div>

			<div class="card col-span-2 bg-base-200 p-4">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold">Ships</h3>
				</div>
				<div class="divider"></div>
				{#if state.ships && state.ships.length > 0}
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{#each state.ships as s}
							<div class="card p-3 shadow-sm">
								<div class="flex items-center justify-between">
									<div>
										<div class="font-medium">{s.shipTemplateId}</div>
										<div class="text-muted text-sm">Quantity: {s.quantity}</div>
									</div>
									<div>
										<span class="badge badge-info">x{s.quantity}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-muted">No ships yet.</p>
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
							class="card cursor-pointer bg-base-200 shadow-md transition-shadow duration-200 hover:shadow-lg"
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
							<div class="p-4">
								<div class="flex items-center gap-4">
									<div class="text-4xl text-primary">
										<BuildingIcon id={building.id} className="text-4xl" />
									</div>
									<div>
										<h4 class="text-lg font-bold">{building.name}</h4>
										<p class="text-muted text-sm">Level {state.buildings?.[building.id] ?? 0}</p>
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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		on:click={closeModal}
		on:keydown={(e) => e.key === 'Escape' && closeModal()}
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="w-11/12 max-w-2xl rounded-lg bg-base-100 p-6 shadow-xl"
			role="document"
			tabindex="-1"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<div class="flex items-start justify-between">
				<div class="flex items-center gap-4">
					<div class="text-5xl text-primary">
						<BuildingIcon id={selectedBuilding!} className="text-5xl" />
					</div>
					<div>
						<h3 class="text-2xl font-bold">{BUILDING_DATA[selectedBuilding].name}</h3>
						<p class="text-md text-muted">
							Level {state.buildings?.[selectedBuilding] ?? 0}
						</p>
					</div>
				</div>
				<button class="btn btn-ghost btn-sm" on:click={closeModal}>✕</button>
			</div>
			<div class="divider my-4"></div>
			<p class="mb-4 text-lg">{BUILDING_DATA[selectedBuilding].description}</p>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<h4 class="mb-2 text-xl font-semibold">Benefit</h4>
					<p class="text-md">
						{typeof BUILDING_DATA[selectedBuilding!].benefit === 'function'
							? (BUILDING_DATA[selectedBuilding!].benefit as any)(
									state.buildings?.[selectedBuilding!] ?? 0
								)
							: BUILDING_DATA[selectedBuilding!].benefit}
					</p>
				</div>
				<div>
					<h4 class="mb-2 text-xl font-semibold">Requirements</h4>
					<div class="text-md">
						<ul class="list-inside list-disc">
							{#each formatRequirements(BUILDING_DATA[selectedBuilding].requires ?? {}) as line}
								<li>{line}</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
			<div class="divider my-4"></div>
			<div>
				<h4 class="mb-2 text-xl font-semibold">Upgrade to Level {nextLevel}</h4>
				<div class="flex items-center justify-between">
					<div>
						{#if BUILDING_DATA[selectedBuilding!].cost}
							<div class="flex items-center gap-4">
								<div>
									<p class="font-bold">Cost:</p>
									<div class="mt-1 flex gap-2">
										{#each Object.entries(BUILDING_DATA[selectedBuilding!].cost?.(nextLevel) ?? {}) as [res, amt]}
											<div class="badge badge-secondary">{res}: {amt}</div>
										{/each}
									</div>
								</div>
								<div>
									<p class="font-bold">Time:</p>
									<p class="mt-1">
										{BUILDING_DATA[selectedBuilding!].time
											? (BUILDING_DATA as any)[selectedBuilding!].time(nextLevel) + 's'
											: '—'}
									</p>
								</div>
							</div>
						{:else}
							<p class="text-md">No cost data</p>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						<button
							class="btn btn-lg btn-primary"
							disabled={!canAffordUpgrade}
							on:click={() => {
								upgradeBuilding(selectedBuilding!);
								closeModal();
							}}>Upgrade</button
						>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
