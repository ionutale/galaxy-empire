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
		<h1 class="text-3xl font-display font-bold text-neon-blue tracking-wide drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">Fleet Command</h1>
		<a href="/fleet/dispatch" class="btn bg-neon-blue text-black border-neon-blue hover:bg-neon-blue/80 hover:border-neon-blue font-bold tracking-wide shadow-[0_0_15px_rgba(0,243,255,0.4)]">Dispatch New Fleet</a>
	</div>

	{#if loading}
		<div class="flex justify-center"><span class="loading loading-spinner loading-lg text-neon-blue"></span></div>
	{:else if activeFleets.length === 0}
		<div class="glass-panel p-6 rounded-xl text-center">
			<p class="text-slate-400 italic">No active fleet missions. Systems nominal.</p>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each activeFleets as fleet}
				<div class="glass-panel p-0 rounded-xl overflow-hidden border border-white/10" transition:fade>
					<div class="p-5">
						<div class="flex justify-between items-start mb-4">
							<div>
								<h2 class="text-xl font-bold font-display text-white capitalize tracking-wide">{fleet.mission} Mission</h2>
								<p class="text-sm text-slate-400 font-mono mt-1">Target System: <span class="text-neon-blue">[{fleet.targetSystem}:{fleet.targetPlanet}]</span></p>
							</div>
							<div class="badge badge-lg border-0 font-bold tracking-wide"
								class:bg-emerald-500={fleet.status === 'active'}
								class:bg-yellow-500={fleet.status === 'returning'}
								class:text-black={fleet.status === 'active' || fleet.status === 'returning'}>
								{fleet.status.toUpperCase()}
							</div>
						</div>
						
						<div class="mt-4 mb-2">
							<div class="flex justify-between text-xs text-slate-400 mb-1 uppercase tracking-wider">
								<span>Mission Progress</span>
								<span>{new Date(fleet.status === 'returning' ? fleet.returnTime : fleet.arrivalTime).toLocaleTimeString()}</span>
							</div>
							<div class="h-2 w-full rounded-full bg-white/10 overflow-hidden">
								<div class="h-full rounded-full bg-neon-blue shadow-[0_0_10px_var(--color-neon-blue)] relative overflow-hidden" style="width: 50%">
									<div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
								</div>
							</div>
						</div>

						<div class="collapse collapse-arrow mt-4 bg-white/5 border border-white/5 rounded-lg">
							<input type="checkbox" />
							<div class="collapse-title text-sm font-medium text-slate-200">Fleet Manifest & Cargo</div>
							<div class="collapse-content text-xs text-slate-400 font-mono">
								<div class="py-2 space-y-2">
									<div>
										<span class="text-neon-blue">SHIPS:</span> {JSON.stringify(fleet.composition)}
									</div>
									<div>
										<span class="text-neon-purple">CARGO:</span> {JSON.stringify(fleet.cargo)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
