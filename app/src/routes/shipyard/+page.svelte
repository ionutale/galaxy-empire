<script lang="ts">
	import { onMount } from 'svelte';
	import { BUILDING_DATA } from '$lib/data/gameData';

	type Template = {
		id: string;
		name: string;
		role?: string;
		buildTime?: number;
		costCredits?: number;
		costMetal?: number;
		costCrystal?: number;
		costFuel?: number;
		attack?: number;
		defense?: number;
	};

	let templates: Template[] = [];
	let error = '';
	let loading = true;
	let qty: Record<string, number> = {};
	let playerState: any = null;

	async function load() {
		loading = true;
		try {
			const [tRes, pRes] = await Promise.all([
				fetch('/api/shipyard/templates'),
				fetch('/api/player/state')
			]);

			if (tRes.ok) {
				templates = (await tRes.json()).templates || [];
				for (const tp of templates) qty[tp.id] = qty[tp.id] ?? 1;
			}

			if (pRes.ok) {
				playerState = (await pRes.json()).state;
			}
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function build(templateId: string) {
		error = '';
		const quantity = Math.max(1, Math.min(99, Number(qty[templateId] ?? 1)));
		const res = await fetch('/api/shipyard/build', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ shipTemplateId: templateId, quantity })
		});
		if (res.ok) {
			// Trigger global state reload to update sidebar
			window.dispatchEvent(new CustomEvent('player:changed'));
			// Reload local state to update resources
			const pRes = await fetch('/api/player/state');
			if (pRes.ok) playerState = (await pRes.json()).state;

			import('$lib/stores/toast').then((m) => m.pushToast(`Construction started`, 'success'));
		} else {
			const b = await res.json().catch(() => ({}));
			error = b?.error || 'build_failed';
		}
	}

	function canAfford(t: Template, q: number) {
		if (!playerState?.resources) return false;
		const r = playerState.resources;
		return (
			r.credits >= (t.costCredits || 0) * q &&
			r.metal >= (t.costMetal || 0) * q &&
			r.crystal >= (t.costCrystal || 0) * q &&
			r.fuel >= (t.costFuel || 0) * q
		);
	}
</script>

<h2 class="mb-4 text-2xl font-semibold">Shipyard</h2>
{#if error}
	<div class="mb-4 alert alert-error">
		<span>{error}</span>
	</div>
{/if}

{#if loading}
	<div class="flex justify-center"><progress class="progress w-56"></progress></div>
{:else}
	{#if playerState?.buildings}
		<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div class="glass-panel p-4 rounded-xl flex items-center justify-between">
				<div>
					<div class="text-sm text-slate-400 uppercase tracking-wider">Shipyard Level</div>
					<div class="text-2xl font-bold text-neon-blue font-display">{playerState.buildings.shipyard ?? 0}</div>
					<div class="text-xs text-slate-500">Determines build speed</div>
				</div>
				<div class="text-neon-blue opacity-50">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
				</div>
			</div>
			<div class="glass-panel p-4 rounded-xl flex items-center justify-between">
				<div>
					<div class="text-sm text-slate-400 uppercase tracking-wider">Nanite Factory</div>
					<div class="text-2xl font-bold text-neon-purple font-display">{playerState.buildings.naniteFactory ?? 0}</div>
					<div class="text-xs text-slate-500">Reduces build time</div>
				</div>
				<div class="text-neon-purple opacity-50">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
				</div>
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
		{#each templates as t}
			{@const q = qty[t.id] || 1}
			{@const affordable = canAfford(t, q)}

			<div class="glass-panel-unified p-0 overflow-hidden border border-white/10 hover:border-neon-blue/50 transition-colors duration-300 group">
				<div class="relative h-32 bg-black/50 flex items-center justify-center overflow-hidden group-hover:border-b group-hover:border-neon-blue/30 transition-colors">
					<!-- Ship Image with Fallback -->
					<img
						src="/images/ships/ship_{t.id}.png"
						alt={t.name}
						class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110"
						on:error={(e) => {
							const target = e.currentTarget;
							if (target instanceof HTMLImageElement) {
								target.style.display = 'none';
								const next = target.nextElementSibling;
								if (next instanceof HTMLElement) {
									next.style.display = 'flex';
								}
							}
						}}
					/>
					<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
						<h3 class="text-lg font-bold font-display text-white group-hover:text-neon-blue transition-colors">{t.name}</h3>
					</div>
				</div>
				
				<div class="p-5">
					<div class="flex items-start justify-between mb-4">
						<div class="flex flex-col gap-2 w-full">
							<div class="flex justify-between items-center w-full">
								<div class="badge badge-sm border-white/20 text-slate-300 bg-white/5">{t.role}</div>
								<div class="text-xs font-mono text-slate-400">
									<span class="text-white">{t.buildTime}s</span>
								</div>
							</div>
								
							<div class="flex gap-3 mt-2 text-xs font-mono">
									<div class="flex items-center gap-1 text-red-400" title="Attack Power">
										<span>⚔️</span>
										<span>{t.attack || 0}</span>
									</div>
									<div class="flex items-center gap-1 text-green-400" title="Defense">
										<span>🛡️</span>
										<span>{t.defense || 0}</span>
									</div>
								</div>
							</div>
						</div>

					<div class="divider my-3 before:bg-white/10 after:bg-white/10"></div>

					<div class="space-y-2 text-sm mb-4">

						<div class="flex justify-between items-center">
							<span class="text-slate-400 text-xs uppercase tracking-wider">Metal</span>
							<span
								class={(playerState?.resources?.metal ?? 0) < (t.costMetal || 0) * q
									? 'font-bold text-red-400'
									: 'text-slate-200'}
							>
								{(t.costMetal || 0) * q}
							</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-slate-400 text-xs uppercase tracking-wider">Crystal</span>
							<span
								class={(playerState?.resources?.crystal ?? 0) < (t.costCrystal || 0) * q
									? 'font-bold text-red-400'
									: 'text-cyan-200'}
							>
								{(t.costCrystal || 0) * q}
							</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-slate-400 text-xs uppercase tracking-wider">Fuel</span>
							<span
								class={(playerState?.resources?.fuel ?? 0) < (t.costFuel || 0) * q
									? 'font-bold text-red-400'
									: 'text-emerald-200'}
							>
								{(t.costFuel || 0) * q}
							</span>
						</div>
					</div>

					<div class="flex items-center justify-between gap-3">
						<div class="flex items-center bg-black/40 rounded-lg border border-white/10">
							<button
								class="btn btn-ghost btn-xs text-white hover:text-neon-blue px-2"
								on:click={() => (qty[t.id] = Math.max(1, (qty[t.id] ?? 1) - 1))}>-</button
							>
							<input
								class="input input-xs w-12 text-center bg-transparent border-none text-white focus:outline-none p-0"
								bind:value={qty[t.id]}
								inputmode="numeric"
							/>
							<button
								class="btn btn-ghost btn-xs text-white hover:text-neon-blue px-2"
								on:click={() => (qty[t.id] = Math.min(99, (qty[t.id] ?? 1) + 1))}>+</button
							>
						</div>
						<button
							class="btn btn-sm flex-1 bg-neon-blue text-black border-neon-blue hover:bg-neon-blue/80 hover:border-neon-blue font-bold tracking-wide shadow-[0_0_10px_rgba(0,243,255,0.3)] disabled:bg-white/5 disabled:text-white/20 disabled:border-transparent"
							disabled={!affordable}
							on:click={() => build(t.id)}
						>
							Build
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
