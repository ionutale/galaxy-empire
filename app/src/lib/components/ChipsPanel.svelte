<script lang="ts">
	import { onMount } from 'svelte';
	let chips: Record<string, number> = {};
	let equipped: Record<string, boolean> = {};
	let loading = true;
	let busy = new Set<string>();
	async function load() {
		loading = true;
		const res = await fetch('/api/player/state');
		if (res.ok) {
			const body = await res.json();
			chips = body.state.chips || {};
			equipped = body.state.equippedChips || {};
		}
		loading = false;
	}
	onMount(load);

	async function upgrade(chipId: string) {
		if (busy.has(chipId)) return;
		busy.add(chipId);
		try {
			await fetch('/api/demo/chips/upgrade', {
				method: 'POST',
				body: JSON.stringify({ chipId }),
				headers: { 'Content-Type': 'application/json' }
			});
			await load();
			const { pushToast } = await import('$lib/stores/toast');
			pushToast(`Upgraded ${formatName(chipId)}`, 'success');
		} finally {
			busy.delete(chipId);
		}
	}

	async function toggleEquip(chipId: string) {
		if (busy.has(chipId)) return;
		busy.add(chipId);
		try {
			await fetch('/api/demo/chips/equip', {
				method: 'POST',
				body: JSON.stringify({ chipId }),
				headers: { 'Content-Type': 'application/json' }
			});
			await load();
		} finally {
			busy.delete(chipId);
		}
	}

	function formatName(id: string) {
		return id.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
	}
</script>

<div class="glass-panel p-4 rounded-xl">
	<div class="flex items-center justify-between mb-4">
		<h4 class="font-display font-semibold text-lg text-neon-blue tracking-wide">Chips</h4>
		{#if loading}
			<progress class="progress progress-info w-20 h-1"></progress>
		{/if}
	</div>
	{#if !loading && Object.keys(chips).length === 0}
		<div class="mt-2 text-sm opacity-80">
			<div class="rounded-lg border border-white/10 bg-white/5 p-3 text-slate-300">
				No chips yet. Explore <a class="link text-neon-blue hover:text-neon-purple" href="/research">Research</a> or the
				<a class="link text-neon-blue hover:text-neon-purple" href="/shipyard">Shipyard</a>.
			</div>
		</div>
	{:else if !loading}
		<ul class="mt-2 space-y-2 text-sm">
			{#each Object.entries(chips) as [id, count]}
				<li class="flex items-center justify-between gap-3 rounded-lg p-3 border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
					<div class="flex-1">
						<div class="leading-tight font-medium text-slate-200">{formatName(id)}</div>
						<div class="opacity-70 text-xs mt-1">
							Level <span class="badge badge-outline badge-xs align-middle border-neon-blue text-neon-blue">{count}</span>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<button
							class="btn btn-ghost btn-xs text-white/50 hover:text-white"
							on:click={() => upgrade(id)}
							disabled={busy.has(id)}>Upgrade</button
						>
						<button
							class="btn btn-xs border-neon-blue/30 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue hover:text-black hover:border-neon-blue"
							class:btn-active={equipped[id]}
							class:bg-neon-blue={equipped[id]}
							class:text-black={equipped[id]}
							on:click={() => toggleEquip(id)}
							disabled={busy.has(id)}>{equipped[id] ? 'Equipped' : 'Equip'}</button
						>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
