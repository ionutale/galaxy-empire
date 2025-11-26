<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';

	export let step: number = 0;
	export let state: any = null;

	// This should match the server-side definition, or we can fetch it via API.
	// For simplicity and reactivity, we can duplicate the static data here or pass it from layout.
	// Let's define it here for now to avoid extra API calls for static text.
	const TUTORIAL_STEPS = [
		{
			id: 0,
			title: 'Welcome Commander',
			description: 'Your journey begins. Construct a Metal Mine to start gathering resources.',
			reward: { metal: 500, crystal: 200 },
			check: (state: any) => (state.buildings?.metalMine ?? 0) >= 1
		},
		{
			id: 1,
			title: 'Power Up',
			description: 'Energy is vital. Upgrade the Metal Mine to level 2.',
			reward: { metal: 600, crystal: 300 },
			check: (state: any) => (state.buildings?.metalMine ?? 0) >= 2
		},
		{
			id: 2,
			title: 'Crystal Clear',
			description: 'Crystals are needed for advanced tech. Build a Crystal Synthesizer.',
			reward: { metal: 1000, credits: 100 },
			check: (state: any) => (state.buildings?.crystalSynthesizer ?? 0) >= 1
		},
		{
			id: 3,
			title: 'Fueling the Empire',
			description: 'Deuterium is the fuel of the stars. Build a Deuterium Refinery.',
			reward: { metal: 1500, crystal: 500 },
			check: (state: any) => (state.buildings?.deuteriumRefinery ?? 0) >= 1
		},
		{
			id: 4,
			title: 'Shipyard Construction',
			description: 'We need to defend ourselves. Build a Shipyard.',
			reward: { metal: 2000, crystal: 1000, fuel: 500 },
			check: (state: any) => (state.buildings?.shipyard ?? 0) >= 1
		},
		{
			id: 5,
			title: 'First Fleet',
			description: 'Construct a Fighter to protect your colony.',
			reward: { credits: 1000, metal: 1000 },
			check: (state: any) => state.ships?.some((s: any) => s.shipTemplateId === 'fighter' && s.quantity > 0)
		}
	];

	$: currentStep = TUTORIAL_STEPS.find(s => s.id === step);
	$: isCompleted = currentStep ? currentStep.check(state) : false;
	$: isAllDone = step >= TUTORIAL_STEPS.length;

	let claiming = false;
	const dispatch = createEventDispatcher();

	async function claim() {
		if (claiming) return;
		claiming = true;
		try {
			const res = await fetch('/api/tutorial/claim', { method: 'POST' });
			if (res.ok) {
				const data = await res.json();
				dispatch('claimed', data);
			}
		} catch (e) {
			console.error(e);
		} finally {
			claiming = false;
		}
	}
</script>

<div class="glass-panel p-4 rounded-xl border border-neon-blue/30 shadow-[0_0_15px_rgba(0,243,255,0.1)]">
	<div class="flex items-center justify-between mb-2">
		<h3 class="text-lg font-bold text-neon-blue flex items-center gap-2">
			<span>📋</span> Mission Log
		</h3>
		{#if !isAllDone}
			<span class="badge badge-outline text-xs border-neon-blue/50 text-neon-blue">Step {step + 1}/{TUTORIAL_STEPS.length}</span>
		{/if}
	</div>

	{#if isAllDone}
		<div class="text-center py-4">
			<div class="text-4xl mb-2">🏆</div>
			<p class="text-slate-300 font-bold">All missions completed!</p>
			<p class="text-xs text-slate-500 mt-1">You are ready to conquer the galaxy.</p>
		</div>
	{:else if currentStep}
		<div transition:slide>
			<h4 class="text-white font-bold text-md mb-1">{currentStep.title}</h4>
			<p class="text-slate-400 text-sm mb-3">{currentStep.description}</p>
			
			<div class="bg-black/30 rounded p-2 mb-3 border border-white/5">
				<p class="text-xs text-slate-500 uppercase tracking-wider mb-1">Rewards</p>
				<div class="flex flex-wrap gap-2">
					{#each Object.entries(currentStep.reward) as [res, amt]}
						<span class="badge badge-sm badge-ghost text-xs gap-1">
							<span class="text-white font-bold">{amt}</span>
							<span class="text-slate-400 capitalize">{res}</span>
						</span>
					{/each}
				</div>
			</div>

			<button 
				class="btn btn-sm w-full gap-2 {isCompleted ? 'btn-primary bg-neon-blue text-black border-neon-blue hover:bg-neon-blue/80' : 'btn-disabled bg-white/5 text-slate-500 border-white/10'}"
				disabled={!isCompleted || claiming}
				on:click={claim}
			>
				{#if claiming}
					<span class="loading loading-spinner loading-xs"></span>
				{:else if isCompleted}
					<span>✨ Claim Reward</span>
				{:else}
					<span>In Progress...</span>
				{/if}
			</button>
		</div>
	{/if}
</div>
