<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { SHIP_TEMPLATES } from '$lib/data/gameData';

	let ships: any[] = [];
	let resources = { metal: 0, crystal: 0, fuel: 0 };
	let loading = true;
	let submitting = false;
	let error = '';

	// Form data
	let targetSystem = Number($page.url.searchParams.get('targetSystem') || 1);
	// Support x/y coords if provided (Galaxy Map uses x/y, but backend uses system ID. 
	// For now, we'll assume system ID is passed or we need a lookup. 
	// The Galaxy Map link sends ?x=...&y=...&planet=...
	// We need to handle this. Since we don't have a direct X/Y -> SystemID lookup on frontend easily without fetching all systems,
	// we might need to rely on the user knowing the system ID or update Galaxy Map to pass System ID.
	// Wait, Galaxy Map DOES pass targetSystem in the original code, but I changed it to x/y/planet in the previous step.
	// Let's revert Galaxy Map to pass targetSystem ID if available, or handle it here.
	// Galaxy Map has `selectedSystem.id`. I should have used that.
	// Let's check Galaxy Map again. It has `selectedSystem.id`.
	// I will update this file to handle `targetSystem` param which I should have used in Galaxy Map.
	// Actually, let's check what I wrote in Galaxy Map: `href="/fleet/dispatch?x={selectedSystem.x}&y={selectedSystem.y}&planet={planet.orbitIndex}"`
	// This is problematic because the backend expects `targetSystem` (ID).
	// I should probably fix Galaxy Map to pass `targetSystem={selectedSystem.id}` instead of x/y.
	// But for now, let's see if I can support both or just fix Galaxy Map.
	// Fixing Galaxy Map is better.
	// However, I am in `dispatch/+page.svelte` now.
	// Let's assume I will fix Galaxy Map in the next step to pass `targetSystem`.
	// So here I will just read `targetSystem` and `planet` (which maps to `targetPlanet`).
	
	let targetPlanet = Number($page.url.searchParams.get('planet') || 1);
	let mission = 'transport';
    
    // If planet param is present, default to attack if it's not my planet? 
    // For now just default to attack if came from "Attack" button (which implies intent).
    if ($page.url.searchParams.has('planet')) {
        mission = 'attack';
    }
	let selectedShips: Record<string, number> = {};
	let cargo = { metal: 0, crystal: 0, fuel: 0 };

	async function loadData() {
		const res = await fetch('/api/player/state');
		if (res.ok) {
			const data = await res.json();
			ships = data.state?.ships || [];
			resources = data.state?.resources || { metal: 0, crystal: 0, fuel: 0 };
			// Initialize selected ships with 0
			ships.forEach((s) => (selectedShips[s.shipTemplateId] = 0));
		}
		loading = false;
	}

	function getShipName(id: string) {
		return SHIP_TEMPLATES.find((t) => t.shipId === id)?.name || id;
	}

	function getMaxCargo() {
		let total = 0;
		for (const [id, count] of Object.entries(selectedShips)) {
			const template = SHIP_TEMPLATES.find((t) => t.shipId === id);
			if (template && count > 0) {
				total += (template.capacity || 0) * count;
			}
		}
		return total;
	}

	$: maxCargo = getMaxCargo();
	$: totalCargoSelected = cargo.metal + cargo.crystal + cargo.fuel;

	$: minSpeed = Object.entries(selectedShips).reduce((min, [id, count]) => {
		if (count > 0) {
			const template = SHIP_TEMPLATES.find((t) => t.shipId === id);
			if (template) return Math.min(min, template.speed || 100);
		}
		return min;
	}, 999999);

	$: travelSeconds = (() => {
		if (minSpeed === 999999) return 0;
		const originSystem = 1;
		const originPlanet = 1;
		const dist = Math.abs(targetSystem - originSystem) * 20000 + Math.abs(targetPlanet - originPlanet) * 200 + 1000;
		return Math.max(10, Math.ceil(dist / minSpeed));
	})();

	$: arrivalTime = new Date(Date.now() + travelSeconds * 1000);

	async function dispatchFleet(redirect: boolean = true) {
		submitting = true;
		error = '';

		// Filter out 0 count ships
		const shipsToSend: Record<string, number> = {};
		for (const [id, count] of Object.entries(selectedShips)) {
			if (count > 0) shipsToSend[id] = count;
		}

		if (Object.keys(shipsToSend).length === 0) {
			error = 'Select at least one ship.';
			submitting = false;
			return;
		}

		if (totalCargoSelected > maxCargo) {
			error = 'Cargo exceeds fleet capacity.';
			submitting = false;
			return;
		}

		const payload = {
			targetSystem,
			targetPlanet,
			mission,
			ships: shipsToSend,
			cargo
		};

		const res = await fetch('/api/fleet/send', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (res.ok) {
			import('$lib/stores/toast').then((m) => m.pushToast('Fleet dispatched successfully', 'success'));
			if (redirect) {
				goto('/fleet');
			} else {
				// Reset form or just stay? Let's reset selection to avoid double send
				ships.forEach((s) => (selectedShips[s.shipTemplateId] = 0));
				cargo = { metal: 0, crystal: 0, fuel: 0 };
			}
		} else {
			const data = await res.json();
			error = data.error || 'Failed to dispatch fleet';
		}
		submitting = false;
	}

	// Templates
	let templates: Record<string, Record<string, number>> = {};
	let newTemplateName = '';

	function loadTemplates() {
		try {
			const saved = localStorage.getItem('ge:fleet_templates');
			if (saved) {
				templates = JSON.parse(saved);
			}
		} catch {}
	}

	function saveTemplate() {
		if (!newTemplateName.trim()) return;
		
		// Filter out 0 count ships
		const templateShips: Record<string, number> = {};
		for (const [id, count] of Object.entries(selectedShips)) {
			if (count > 0) templateShips[id] = count;
		}

		if (Object.keys(templateShips).length === 0) {
			import('$lib/stores/toast').then((m) => m.pushToast('Cannot save empty template', 'error'));
			return;
		}

		templates[newTemplateName.trim()] = templateShips;
		localStorage.setItem('ge:fleet_templates', JSON.stringify(templates));
		newTemplateName = '';
		import('$lib/stores/toast').then((m) => m.pushToast('Template saved', 'success'));
	}

	function deleteTemplate(name: string) {
		delete templates[name];
		templates = templates; // trigger reactivity
		localStorage.setItem('ge:fleet_templates', JSON.stringify(templates));
	}

	function applyTemplate(name: string) {
		const template = templates[name];
		if (!template) return;

		// Reset current selection
		Object.keys(selectedShips).forEach(k => selectedShips[k] = 0);

		// Apply template, capped by available ships
		for (const [id, count] of Object.entries(template)) {
			const ship = ships.find(s => s.shipTemplateId === id);
			if (ship) {
				selectedShips[id] = Math.min(ship.quantity, count);
			}
		}
		import('$lib/stores/toast').then((m) => m.pushToast(`Template "${name}" loaded`, 'info'));
	}

	onMount(() => {
		loadData();
		loadTemplates();
	});
</script>

<div class="mx-auto max-w-4xl p-6">
	<h1 class="mb-6 text-3xl font-bold text-primary">Dispatch Fleet</h1>

	{#if loading}
		<div class="loading loading-lg loading-spinner"></div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Left Column: Mission & Target -->
			<div class="space-y-6">
				<div class="glass-panel p-6 rounded-xl">
					<h2 class="text-xl font-bold font-display text-neon-blue mb-4 tracking-wide">Mission Parameters</h2>

					<div class="form-control w-full mb-4">
						<label class="label" for="target-system"><span class="label-text text-slate-300">Target Coordinates</span></label>
						<div class="flex gap-2">
							<input
								id="target-system"
								type="number"
								bind:value={targetSystem}
								min="1"
								class="input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-neon-blue focus:outline-none"
								placeholder="System"
							/>
							<input
								id="target-planet"
								type="number"
								bind:value={targetPlanet}
								min="1"
								class="input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-neon-blue focus:outline-none"
								placeholder="Planet"
								aria-label="Planet"
							/>
						</div>
					</div>

					<div class="form-control w-full mb-4">
						<label class="label" for="mission-select"><span class="label-text text-slate-300">Mission Type</span></label>
						<select id="mission-select" bind:value={mission} class="select select-bordered bg-white/5 border-white/10 text-white focus:border-neon-blue focus:outline-none">
							<option value="transport">Transport</option>
							<option value="attack">Attack</option>
							<option value="spy">Espionage</option>
							<option value="colonize">Colonize</option>
							<option value="recycle">Recycle</option>
						</select>
					</div>

					{#if travelSeconds > 0}
						<div class="mt-4 p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
							<div class="flex justify-between text-sm">
								<span class="text-slate-400">Distance:</span>
								<span class="text-white font-mono">{Math.abs(targetSystem - 1) * 20000 + Math.abs(targetPlanet - 1) * 200 + 1000} km</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-slate-400">Fleet Speed:</span>
								<span class="text-white font-mono">{minSpeed === 999999 ? '-' : minSpeed}</span>
							</div>
							<div class="divider my-1 before:bg-white/10 after:bg-white/10"></div>
							<div class="flex justify-between items-center">
								<span class="text-slate-300 font-medium">Travel Time:</span>
								<span class="text-neon-blue font-mono font-bold text-lg">
									{new Date(travelSeconds * 1000).toISOString().substr(11, 8)}
								</span>
							</div>
							<div class="flex justify-between items-center text-xs">
								<span class="text-slate-500">Arrival:</span>
								<span class="text-slate-300 font-mono">
									{arrivalTime.toLocaleTimeString()}
								</span>
							</div>
						</div>
					{/if}
				</div>

				<div class="glass-panel p-6 rounded-xl">
					<h2 class="text-xl font-bold font-display text-neon-blue mb-4 tracking-wide">Cargo Load</h2>
					<div class="mb-4 p-3 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center">
						<div class="text-sm text-slate-400 uppercase tracking-wider">Capacity</div>
						<div class="text-lg font-mono font-bold" class:text-red-400={totalCargoSelected > maxCargo} class:text-white={totalCargoSelected <= maxCargo}>
							{totalCargoSelected} / {maxCargo}
						</div>
					</div>

					<div class="space-y-4">
						<div class="form-control">
							<label class="label py-0 mb-1" for="cargo-metal"
								><span class="label-text text-slate-300">Metal ({resources.metal})</span></label
							>
							<input
								type="range"
								min="0"
								max={Math.min(resources.metal, maxCargo)}
								bind:value={cargo.metal}
								class="range range-xs mb-2 [--range-shdw:var(--color-neon-blue)]"
								aria-label="Metal amount range"
							/>
							<input
								id="cargo-metal"
								type="number"
								bind:value={cargo.metal}
								class="input input-sm input-bordered bg-white/5 border-white/10 text-white focus:border-neon-blue"
							/>
						</div>
						<div class="form-control">
							<label class="label py-0 mb-1" for="cargo-crystal"
								><span class="label-text text-slate-300">Crystal ({resources.crystal})</span></label
							>
							<input
								type="range"
								min="0"
								max={Math.min(resources.crystal, maxCargo)}
								bind:value={cargo.crystal}
								class="range range-xs mb-2 [--range-shdw:var(--color-neon-purple)]"
								aria-label="Crystal amount range"
							/>
							<input
								id="cargo-crystal"
								type="number"
								bind:value={cargo.crystal}
								class="input input-sm input-bordered bg-white/5 border-white/10 text-white focus:border-neon-blue"
							/>
						</div>
						<div class="form-control">
							<label class="label py-0 mb-1" for="cargo-fuel"
								><span class="label-text text-slate-300">Fuel ({resources.fuel})</span></label
							>
							<input
								type="range"
								min="0"
								max={Math.min(resources.fuel, maxCargo)}
								bind:value={cargo.fuel}
								class="range range-xs mb-2 [--range-shdw:theme(colors.emerald.400)]"
								aria-label="Fuel amount range"
							/>
							<input
								id="cargo-fuel"
								type="number"
								bind:value={cargo.fuel}
								class="input input-sm input-bordered bg-white/5 border-white/10 text-white focus:border-neon-blue"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Right Column: Fleet Composition -->
			<div class="glass-panel p-6 rounded-xl">
				<h2 class="text-xl font-bold font-display text-neon-blue mb-4 tracking-wide">Select Ships</h2>
				
				<!-- Templates Section -->
				<div class="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
					<h3 class="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Fleet Templates</h3>
					
					<div class="flex gap-2 mb-4">
						<input 
							type="text" 
							bind:value={newTemplateName} 
							placeholder="Template Name" 
							class="input input-sm input-bordered bg-black/30 border-white/10 text-white focus:border-neon-blue w-full"
						/>
						<button 
							class="btn btn-sm btn-square btn-outline border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black"
							on:click={saveTemplate}
							disabled={!newTemplateName.trim()}
							title="Save current selection as template"
						>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
							</svg>
						</button>
					</div>

					{#if Object.keys(templates).length > 0}
						<div class="flex flex-wrap gap-2">
							{#each Object.keys(templates) as name}
								<div class="join">
									<button 
										class="btn btn-xs join-item btn-outline border-white/20 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/30"
										on:click={() => applyTemplate(name)}
									>
										{name}
									</button>
									<button 
										class="btn btn-xs join-item btn-outline border-white/20 text-error hover:bg-error/20 hover:border-error/50"
										on:click={() => deleteTemplate(name)}
										title="Delete template"
									>
										×
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-xs text-slate-500 italic">No saved templates</div>
					{/if}
				</div>

				<div class="max-h-[600px] space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
					{#each ships as ship}
						{@const template = SHIP_TEMPLATES.find(t => t.shipId === ship.shipTemplateId)}
						{@const capacity = template?.capacity || 0}
						{@const selected = selectedShips[ship.shipTemplateId] || 0}
						{@const available = Math.max(0, ship.quantity - selected)}
						
						<div class="flex items-center justify-between rounded-lg bg-white/5 border border-white/5 p-3 hover:bg-white/10 transition-colors">
							<div>
								<div class="font-bold text-slate-200">{template?.name || ship.shipTemplateId}</div>
								<div class="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
									<span>Available: <span class="text-white font-mono">{available}</span></span>
									<span>Loot: <span class="text-emerald-400 font-mono">{capacity}</span></span>
									<span class="flex items-center gap-1" title="Attack">⚔️ <span class="text-red-400 font-mono">{template?.attack || 0}</span></span>
									<span class="flex items-center gap-1" title="Defense">🛡️ <span class="text-green-400 font-mono">{template?.defense || 0}</span></span>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<button
									class="btn btn-square btn-xs glass-panel hover:bg-white/20 text-white border-white/20"
									on:click={() =>
										(selectedShips[ship.shipTemplateId] = Math.max(
											0,
											selected - 1
										))}>-</button
								>
								<input
									type="number"
									bind:value={selectedShips[ship.shipTemplateId]}
									class="input input-xs w-16 text-center bg-black/50 border-white/10 text-white focus:border-neon-blue"
									min="0"
									max={ship.quantity}
								/>
								<button
									class="btn btn-square btn-xs glass-panel hover:bg-white/20 text-white border-white/20"
									on:click={() =>
										(selectedShips[ship.shipTemplateId] = Math.min(
											ship.quantity,
											selected + 1
										))}>+</button
								>
								<button
									class="btn btn-xs btn-outline border-neon-blue/50 text-neon-blue hover:bg-neon-blue hover:text-black hover:border-neon-blue"
									on:click={() => (selectedShips[ship.shipTemplateId] = ship.quantity)}
									>Max</button
								>
							</div>
						</div>
					{/each}
					{#if ships.length === 0}
						<div class="py-4 text-center opacity-50 text-slate-400">
							No ships available. Build some in the Shipyard!
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if error}
			<div class="mt-6 alert alert-error">
				<span>{error}</span>
			</div>
		{/if}

		<div class="mt-8 sticky bottom-4 z-20">
			<div class="glass-panel p-4 rounded-xl border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 bg-black/80 backdrop-blur-xl">
				<div class="flex flex-col">
					{#if totalCargoSelected > maxCargo}
						<div class="text-error text-sm font-bold">Cargo exceeds fleet capacity!</div>
					{:else if Object.keys(selectedShips).every(k => !selectedShips[k])}
						<div class="text-warning text-sm">Select ships to dispatch.</div>
					{:else}
						<div class="text-sm text-slate-300">
							Ready to dispatch <span class="text-white font-bold">{Object.values(selectedShips).reduce((a, b) => a + b, 0)}</span> ships
						</div>
						<div class="text-xs text-slate-500">
							Total Capacity: <span class="text-neon-blue">{maxCargo}</span>
						</div>
					{/if}
				</div>

				<div class="flex gap-2 w-full md:w-auto">
					<button
						class="btn btn-outline border-neon-blue text-neon-blue hover:bg-neon-blue/10 hover:border-neon-blue font-bold tracking-wide flex-1 md:flex-none"
						on:click={() => dispatchFleet(false)}
						disabled={submitting || totalCargoSelected > maxCargo || Object.keys(selectedShips).every(k => !selectedShips[k])}
					>
						{#if submitting}
							<span class="loading loading-spinner"></span>
						{/if}
						Dispatch
					</button>
					<button
						class="btn bg-neon-blue text-black border-neon-blue hover:bg-neon-blue/80 hover:border-neon-blue font-bold tracking-wide shadow-[0_0_15px_rgba(0,243,255,0.4)] flex-1 md:flex-none"
						on:click={() => dispatchFleet(true)}
						disabled={submitting || totalCargoSelected > maxCargo || Object.keys(selectedShips).every(k => !selectedShips[k])}
					>
						{#if submitting}
							<span class="loading loading-spinner"></span>
						{/if}
						Dispatch & View
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
