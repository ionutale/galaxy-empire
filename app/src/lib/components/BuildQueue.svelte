<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	import { BUILDING_DATA, SHIP_TEMPLATES, RESEARCH_DATA } from '$lib/data/gameData';

	export let builds: any[] = [];
	export let user: any = null;

	const dispatch = createEventDispatcher();

	let now = Date.now();

	// Update time every second
	import { onMount } from 'svelte';
	onMount(() => {
		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(interval);
	});

	// Helper to format names
	const SHIP_DATA = SHIP_TEMPLATES.reduce(
		(acc, s) => {
			acc[s.shipId] = s;
			return acc;
		},
		{} as Record<string, any>
	);

	function formatName(id: string) {
		if (!id) return 'Unknown';
		if (BUILDING_DATA[id]) return BUILDING_DATA[id].name;
		if (SHIP_DATA[id]) return SHIP_DATA[id].name;
		if (RESEARCH_DATA[id as keyof typeof RESEARCH_DATA]) return RESEARCH_DATA[id as keyof typeof RESEARCH_DATA].name;
		return id;
	}

	function formatTime(seconds: number) {
		if (seconds == null || seconds < 0) return '-';
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		if (h > 0) return `${h}h ${m}m ${s}s`;
		if (m > 0) return `${m}m ${s}s`;
		return `${s}s`;
	}

	// Process builds for display
	$: processedList = (builds || [])
		.map((b) => {
			if (b.status === 'completed') return { ...b, remainingSeconds: 0 };
			if (b.status === 'queued') return { ...b, remainingSeconds: b.durationSeconds };

			const startTime = new Date(b.createdAt).getTime();
			const endTime = startTime + b.durationSeconds * 1000;
			const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
			return { ...b, remainingSeconds: remaining };
		})
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	$: activeBuilds = processedList.filter((b) => b.status === 'in-progress' || b.status === 'queued');
	$: completedBuilds = processedList.filter((b) => b.status === 'completed');

	let loadingHistory = false;

	function loadMore() {
		loadingHistory = true;
		dispatch('loadMore');
		// Reset loading state after a delay or when parent updates?
		// For simplicity, just reset it after a short timeout to allow re-clicking if needed
		setTimeout(() => loadingHistory = false, 1000);
	}
</script>

<div class="h-full flex flex-col p-4 gap-4">
	<h2 class="text-xl font-bold text-neon-blue flex items-center gap-2">
		<span>🏗️</span> Construction Queue
	</h2>

	{#if !user}
		<div class="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50">
			<p>Log in to view queue</p>
		</div>
	{:else if processedList.length === 0}
		<div class="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50">
			<span class="text-4xl mb-2">💤</span>
			<p>Queue is empty</p>
		</div>
	{:else}
		<div class="flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10 pr-2">
			
			<!-- Active Builds -->
			{#if activeBuilds.length > 0}
				<div class="space-y-2">
					<h3 class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 sticky top-0 bg-black/80 backdrop-blur py-2 z-10">In Progress</h3>
					{#each activeBuilds as build (build.id)}
						<div class="relative overflow-hidden rounded-lg bg-white/5 border border-white/10 p-3 group transition-all hover:bg-white/10" transition:slide>
							<div class="relative z-10 flex justify-between items-start">
								<div>
									<div class="font-bold text-sm text-white">{formatName(build.buildingId || build.techId || build.shipTemplateId)}</div>
									<div class="text-xs text-slate-400 flex items-center gap-2 mt-1">
										<span class="font-mono text-neon-blue">{formatTime(build.remainingSeconds)}</span>
										{#if build.quantity > 1}
											<span class="badge badge-xs badge-ghost">x{build.quantity}</span>
										{/if}
									</div>
								</div>
								<div class="badge badge-sm badge-outline border-white/20 text-xs uppercase tracking-wider">{build.type}</div>
							</div>
							
							<!-- Progress Bar Background -->
							{#if build.status === 'in-progress'}
								<div 
									class="absolute bottom-0 left-0 h-1 bg-neon-blue shadow-[0_0_10px_var(--color-neon-blue)] transition-all duration-1000 ease-linear" 
									style="width: {((build.totalDuration - build.remainingSeconds) / build.totalDuration) * 100}%"
								></div>
							{/if}
							{#if build.status === 'queued'}
								<div class="absolute bottom-0 left-0 h-1 w-full bg-white/5"></div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<!-- Completed History -->
			{#if completedBuilds.length > 0}
				<div class="space-y-2">
					<h3 class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 sticky top-0 bg-black/80 backdrop-blur py-2 z-10">Completed</h3>
					{#each completedBuilds as build (build.id)}
						<div class="rounded-lg bg-white/5 border border-white/5 p-2 opacity-60 hover:opacity-100 transition-all flex justify-between items-center">
							<div>
								<div class="text-sm font-medium text-slate-300">{formatName(build.buildingId || build.techId || build.shipTemplateId)}</div>
								<div class="text-[10px] text-slate-500">{new Date(build.processedAt).toLocaleString()}</div>
							</div>
							<div class="flex flex-col items-end gap-1">
								<span class="text-xs text-emerald-400 font-bold">Done</span>
								{#if build.level}
									<span class="text-[10px] text-slate-400">Lvl {build.level}</span>
								{/if}
							</div>
						</div>
					{/each}
					
					<div class="pt-2 flex justify-center">
						<button 
							class="btn btn-xs btn-ghost text-slate-500 hover:text-white" 
							class:loading={loadingHistory}
							on:click={loadMore}
						>
							Load More
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
