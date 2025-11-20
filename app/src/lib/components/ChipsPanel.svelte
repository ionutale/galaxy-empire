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

<div class="card border border-base-300 bg-base-100 p-3">
	<div class="flex items-center justify-between">
		<h4 class="font-semibold">Chips</h4>
		{#if loading}
			<progress class="progress-xs progress w-20"></progress>
		{/if}
	</div>
	{#if !loading && Object.keys(chips).length === 0}
		<div class="mt-2 text-sm opacity-80">
			<div class="rounded-lg border border-white/10 bg-white/5 p-3">
				No chips yet. Explore <a class="link" href="/research">Research</a> or the
				<a class="link" href="/shipyard">Shipyard</a>.
			</div>
		</div>
	{:else if !loading}
		<ul class="mt-2 space-y-2 text-sm">
			{#each Object.entries(chips) as [id, count]}
				<li class="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-base-200/60">
					<div class="flex-1">
						<div class="leading-tight font-medium">{formatName(id)}</div>
						<div class="opacity-70">
							Level <span class="badge badge-outline badge-xs align-middle">{count}</span>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<button
							class="btn btn-ghost btn-xs"
							on:click={() => upgrade(id)}
							disabled={busy.has(id)}>Upgrade</button
						>
						<button
							class="btn btn-xs"
							class:btn-accent={equipped[id]}
							on:click={() => toggleEquip(id)}
							disabled={busy.has(id)}>{equipped[id] ? 'Equipped' : 'Equip'}</button
						>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
