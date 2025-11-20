<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let activeFleets: any[] = [];
	let loading = true;

	async function fetchFleets() {
		loading = true;
		const res = await fetch('/api/player/state'); // We might need a dedicated fleets endpoint or include it in state
		// For now, let's assume we need to add fleets to player state or create a new endpoint.
		// Let's create a simple endpoint for active fleets or just use the state one if I update it.
		// I haven't updated player/state to return fleets yet.
		// Let's assume I will update player/state or fetch from a new endpoint.
		// I'll create /api/fleet/active
		const fleetsRes = await fetch('/api/fleet/active');
		if (fleetsRes.ok) {
			activeFleets = await fleetsRes.json();
		}
		loading = false;
	}

	onMount(fetchFleets);
</script>

<div class="space-y-6 p-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold text-primary">Fleet Command</h1>
		<a href="/fleet/dispatch" class="btn btn-primary">Dispatch New Fleet</a>
	</div>

	{#if loading}
		<div class="loading loading-lg loading-spinner"></div>
	{:else if activeFleets.length === 0}
		<div class="alert alert-info">No active fleet missions.</div>
	{:else}
		<div class="grid gap-4">
			{#each activeFleets as fleet}
				<div class="card bg-base-200 shadow-xl" transition:fade>
					<div class="card-body">
						<h2 class="card-title capitalize">{fleet.mission} Mission</h2>
						<div class="flex justify-between text-sm">
							<span>Target: [{fleet.targetSystem}:{fleet.targetPlanet}]</span>
							<span
								>Status: <span
									class="badge"
									class:badge-success={fleet.status === 'active'}
									class:badge-warning={fleet.status === 'returning'}>{fleet.status}</span
								></span
							>
						</div>
						<div class="mt-2 h-2.5 w-full rounded-full bg-gray-700">
							<!-- Progress bar logic needed, for now just a placeholder -->
							<div class="h-2.5 rounded-full bg-blue-600" style="width: 50%"></div>
						</div>
						<div class="mt-1 text-xs text-gray-400">
							ETA: {new Date(
								fleet.status === 'returning' ? fleet.returnTime : fleet.arrivalTime
							).toLocaleString()}
						</div>
						<div class="collapse-arrow collapse mt-2 bg-base-300">
							<input type="checkbox" />
							<div class="collapse-title text-sm font-medium">Composition & Cargo</div>
							<div class="collapse-content text-xs">
								<p>Ships: {JSON.stringify(fleet.composition)}</p>
								<p>Cargo: {JSON.stringify(fleet.cargo)}</p>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
