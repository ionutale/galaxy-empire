<script lang="ts">
	export let report: any;
	
	// Helper to format numbers
	const f = (n: number) => n.toLocaleString();
	
	// Helper to get ship/building names (mock implementation if not available in context)
	// Ideally we pass a map or use a store, but for now we'll just capitalize or use ID
	const getName = (id: string) => id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
</script>

<div class="card bg-base-200 shadow-xl border border-yellow-500/20">
	<div class="card-body">
		<div class="flex justify-between items-start mb-6">
			<div>
				<h2 class="card-title text-2xl text-yellow-400 flex items-center gap-2">
					🕵️ Espionage Report
				</h2>
				<div class="text-sm text-slate-400 mt-1">
					Target: <span class="text-white font-bold">{report.targetId || 'Unknown'}</span> 
					at <span class="text-neon-blue">[{report.targetSystem}:{report.targetPlanet}]</span>
				</div>
				<div class="text-xs text-slate-500 mt-1">
					{new Date(report.timestamp).toLocaleString()}
				</div>
			</div>
			<div class="badge badge-lg" class:badge-success={report.level >= 1} class:badge-error={report.level === 0}>
				Intel Level: {report.level}
			</div>
		</div>

		{#if report.level === 0}
			<div class="alert alert-error">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				<span>{report.content.message || 'Mission Failed. Probes destroyed.'}</span>
			</div>
		{:else}
			<div class="space-y-6">
				<!-- Resources (Level 1) -->
				{#if report.content.resources}
					<div class="bg-black/20 rounded-lg p-4 border border-white/5">
						<h3 class="text-lg font-bold text-slate-300 mb-3 border-b border-white/10 pb-2">Resources</h3>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div class="flex flex-col">
								<span class="text-xs text-slate-500 uppercase">Metal</span>
								<span class="text-xl font-mono text-white">{f(report.content.resources.metal)}</span>
							</div>
							<div class="flex flex-col">
								<span class="text-xs text-slate-500 uppercase">Crystal</span>
								<span class="text-xl font-mono text-white">{f(report.content.resources.crystal)}</span>
							</div>
							<div class="flex flex-col">
								<span class="text-xs text-slate-500 uppercase">Fuel</span>
								<span class="text-xl font-mono text-white">{f(report.content.resources.fuel)}</span>
							</div>
							<div class="flex flex-col">
								<span class="text-xs text-slate-500 uppercase">Credits</span>
								<span class="text-xl font-mono text-white">{f(report.content.resources.credits || 0)}</span>
							</div>
						</div>
					</div>
				{/if}

				<!-- Fleet (Level 2) -->
				{#if report.content.ships}
					<div class="bg-black/20 rounded-lg p-4 border border-white/5">
						<h3 class="text-lg font-bold text-slate-300 mb-3 border-b border-white/10 pb-2">Fleet</h3>
						{#if Object.keys(report.content.ships).length > 0}
							<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
								{#each Object.entries(report.content.ships) as [id, count]}
									<div class="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
										<span class="text-sm text-slate-300">{getName(id)}</span>
										<span class="font-mono text-yellow-400">{f(count as number)}</span>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-sm text-slate-500 italic">No ships detected.</div>
						{/if}
					</div>
				{/if}

				<!-- Defense (Level 3) -->
				{#if report.content.defense}
					<div class="bg-black/20 rounded-lg p-4 border border-white/5">
						<h3 class="text-lg font-bold text-slate-300 mb-3 border-b border-white/10 pb-2">Defense</h3>
						{#if Object.keys(report.content.defense).length > 0}
							<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
								{#each Object.entries(report.content.defense) as [id, count]}
									<div class="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
										<span class="text-sm text-slate-300">{getName(id)}</span>
										<span class="font-mono text-green-400">{f(count as number)}</span>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-sm text-slate-500 italic">No defenses detected.</div>
						{/if}
					</div>
				{/if}

				<!-- Buildings (Level 4) -->
				{#if report.content.buildings}
					<div class="bg-black/20 rounded-lg p-4 border border-white/5">
						<h3 class="text-lg font-bold text-slate-300 mb-3 border-b border-white/10 pb-2">Buildings</h3>
						{#if Object.keys(report.content.buildings).length > 0}
							<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
								{#each Object.entries(report.content.buildings) as [id, level]}
									<div class="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
										<span class="text-sm text-slate-300">{getName(id)}</span>
										<span class="font-mono text-blue-400">Lvl {level}</span>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-sm text-slate-500 italic">No buildings detected.</div>
						{/if}
					</div>
				{/if}

				<!-- Research (Level 5) -->
				{#if report.content.research}
					<div class="bg-black/20 rounded-lg p-4 border border-white/5">
						<h3 class="text-lg font-bold text-slate-300 mb-3 border-b border-white/10 pb-2">Technology</h3>
						{#if Object.keys(report.content.research).length > 0}
							<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
								{#each Object.entries(report.content.research) as [id, level]}
									<div class="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
										<span class="text-sm text-slate-300">{getName(id)}</span>
										<span class="font-mono text-purple-400">Lvl {level}</span>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-sm text-slate-500 italic">No technology detected.</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
