<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { SHIP_TEMPLATES } from '$lib/data/gameData';

	let ships: any[] = [];
	let resources = { metal: 0, crystal: 0, fuel: 0 };
	let loading = true;
	let submitting = false;
	let error = '';

	// Form data
	let targetSystem = 1;
	let targetPlanet = 1;
	let mission = 'transport';
	let selectedShips: Record<string, number> = {};
	let cargo = { metal: 0, crystal: 0, fuel: 0 };

	async function loadData() {
		const res = await fetch('/api/player/state');
		if (res.ok) {
			const data = await res.json();
			ships = data.ships || [];
			resources = data.resources || { metal: 0, crystal: 0, fuel: 0 };
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

	async function dispatchFleet() {
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
			goto('/fleet');
		} else {
			const data = await res.json();
			error = data.error || 'Failed to dispatch fleet';
		}
		submitting = false;
	}

	onMount(loadData);
</script>

<div class="mx-auto max-w-4xl p-6">
	<h1 class="mb-6 text-3xl font-bold text-primary">Dispatch Fleet</h1>

	{#if loading}
		<div class="loading loading-lg loading-spinner"></div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Left Column: Mission & Target -->
			<div class="space-y-6">
				<div class="card bg-base-200 shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Mission Parameters</h2>

						<div class="form-control w-full">
							<label class="label"><span class="label-text">Target Coordinates</span></label>
							<div class="flex gap-2">
								<input
									type="number"
									bind:value={targetSystem}
									min="1"
									class="input-bordered input w-full"
									placeholder="System"
								/>
								<input
									type="number"
									bind:value={targetPlanet}
									min="1"
									class="input-bordered input w-full"
									placeholder="Planet"
								/>
							</div>
						</div>

						<div class="form-control w-full">
							<label class="label"><span class="label-text">Mission Type</span></label>
							<select bind:value={mission} class="select-bordered select">
								<option value="transport">Transport</option>
								<option value="attack">Attack</option>
								<option value="spy">Espionage</option>
								<option value="colonize">Colonize</option>
								<option value="recycle">Recycle</option>
							</select>
						</div>
					</div>
				</div>

				<div class="card bg-base-200 shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Cargo Load</h2>
						<div class="mb-2 stat p-0">
							<div class="stat-title">Capacity</div>
							<div class="stat-value text-lg" class:text-error={totalCargoSelected > maxCargo}>
								{totalCargoSelected} / {maxCargo}
							</div>
						</div>

						<div class="space-y-2">
							<div class="form-control">
								<label class="label py-0"
									><span class="label-text">Metal ({resources.metal})</span></label
								>
								<input
									type="range"
									min="0"
									max={Math.min(resources.metal, maxCargo)}
									bind:value={cargo.metal}
									class="range range-primary range-xs"
								/>
								<input
									type="number"
									bind:value={cargo.metal}
									class="input-bordered input input-sm"
								/>
							</div>
							<div class="form-control">
								<label class="label py-0"
									><span class="label-text">Crystal ({resources.crystal})</span></label
								>
								<input
									type="range"
									min="0"
									max={Math.min(resources.crystal, maxCargo)}
									bind:value={cargo.crystal}
									class="range range-secondary range-xs"
								/>
								<input
									type="number"
									bind:value={cargo.crystal}
									class="input-bordered input input-sm"
								/>
							</div>
							<div class="form-control">
								<label class="label py-0"
									><span class="label-text">Fuel ({resources.fuel})</span></label
								>
								<input
									type="range"
									min="0"
									max={Math.min(resources.fuel, maxCargo)}
									bind:value={cargo.fuel}
									class="range range-accent range-xs"
								/>
								<input
									type="number"
									bind:value={cargo.fuel}
									class="input-bordered input input-sm"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Right Column: Fleet Composition -->
			<div class="card bg-base-200 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Select Ships</h2>
					<div class="max-h-[600px] space-y-4 overflow-y-auto pr-2">
						{#each ships as ship}
							<div class="flex items-center justify-between rounded-lg bg-base-300 p-3">
								<div>
									<div class="font-bold">{getShipName(ship.shipTemplateId)}</div>
									<div class="text-xs opacity-70">Available: {ship.quantity}</div>
								</div>
								<div class="flex items-center gap-2">
									<button
										class="btn btn-square btn-xs"
										on:click={() =>
											(selectedShips[ship.shipTemplateId] = Math.max(
												0,
												(selectedShips[ship.shipTemplateId] || 0) - 1
											))}>-</button
									>
									<input
										type="number"
										bind:value={selectedShips[ship.shipTemplateId]}
										class="input-bordered input input-xs w-16 text-center"
										min="0"
										max={ship.quantity}
									/>
									<button
										class="btn btn-square btn-xs"
										on:click={() =>
											(selectedShips[ship.shipTemplateId] = Math.min(
												ship.quantity,
												(selectedShips[ship.shipTemplateId] || 0) + 1
											))}>+</button
									>
									<button
										class="btn btn-outline btn-xs"
										on:click={() => (selectedShips[ship.shipTemplateId] = ship.quantity)}
										>Max</button
									>
								</div>
							</div>
						{/each}
						{#if ships.length === 0}
							<div class="py-4 text-center opacity-50">
								No ships available. Build some in the Shipyard!
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		{#if error}
			<div class="mt-6 alert alert-error">
				<span>{error}</span>
			</div>
		{/if}

		<div class="mt-8 flex justify-end">
			<button
				class="btn btn-lg btn-primary"
				on:click={dispatchFleet}
				disabled={submitting || totalCargoSelected > maxCargo}
			>
				{#if submitting}
					<span class="loading loading-spinner"></span>
				{/if}
				Dispatch Fleet
			</button>
		</div>
	{/if}
</div>
