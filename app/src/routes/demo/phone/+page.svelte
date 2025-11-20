<script lang="ts">
	// Local UI state for tabs and pages
	let activePage: 'home' | 'planets' | 'fleet' | 'galactonite' | 'capsule' = 'home';
	let fleetTab: 'dispatch' | 'inflight' = 'dispatch';
	let planetsTab: 'galaxy' | 'system' = 'galaxy';
	let showDeployModal = false;
	let toast: string | null = null;
	let builds: any[] = [];
	let fleets: any[] = [];
	let pollId: number | null = null;

	async function loadQueues() {
		try {
			const [bRes, fRes] = await Promise.all([
				fetch('/api/demo/builds'),
				fetch('/api/demo/fleets')
			]);
			if (bRes.ok) builds = (await bRes.json()).builds ?? [];
			if (fRes.ok) fleets = (await fRes.json()).fleets ?? [];
		} catch {
			// ignore
		}
	}

	function startPolling() {
		if (pollId) return;
		pollId = setInterval(() => loadQueues(), 5000) as unknown as number;
		loadQueues();
	}

	function stopPolling() {
		if (pollId) {
			clearInterval(pollId);
			pollId = null;
		}
	}

	// start polling when the page is mounted
	startPolling();

	async function postBuild(type = 'scout', count = 1) {
		try {
			const res = await fetch('/api/demo/builds', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ type, count })
			});
			if (res.ok) {
				toast = 'Build queued';
				// notify others (ResourceBar will reload on mount only; use event)
				window.dispatchEvent(new CustomEvent('demo:changed'));
			} else {
				toast = 'Build failed';
			}
		} catch {
			toast = 'Build failed';
		}
		setTimeout(() => (toast = null), 2500);
	}

	async function dispatchFleet(destination = '3-17-Nereid') {
		try {
			const res = await fetch('/api/demo/fleet/dispatch', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ destination, etaSeconds: 30, ships: { scout: 3 } })
			});
			if (res.ok) {
				toast = 'Fleet dispatched';
				window.dispatchEvent(new CustomEvent('demo:changed'));
			} else {
				toast = 'Dispatch failed';
			}
		} catch {
			toast = 'Dispatch failed';
		}
		setTimeout(() => (toast = null), 2500);
	}

	function setPage(p: typeof activePage) {
		activePage = p;
		if (p === 'fleet') fleetTab = 'dispatch';
		if (p === 'planets') planetsTab = 'galaxy';
	}
</script>

<!-- Phone mockup container -->
<div
	class="relative h-[90dvh] max-h-[800px] w-full max-w-[400px] overflow-hidden rounded-[3rem] border-8 border-black shadow-[0_0_40px_rgba(0,255,255,.5),_inset_0_0_20px_rgba(0,0,0,.8)]"
	style="background-image:url('https://placehold.co/400x800/1e293b/a0aec0?text=SPACE+BACKGROUND');background-size:cover;background-position:center;"
>
	<!-- gradient overlay -->
	<div
		class="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/70 to-transparent"
	></div>

	<!-- top bar -->
	<div
		class="relative z-[2] flex items-center justify-between rounded-b-xl border-b-2 border-blue-700 bg-gradient-to-b from-blue-900 to-blue-950 p-4 shadow-xl"
	>
		<span class="text-xs text-gray-400">1318</span>
		<div class="flex items-center gap-2 text-sm font-bold text-blue-300">
			<div class="flex items-center"><span class="mr-1 h-4 w-4 text-yellow-400">⬤</span>9.21M</div>
			<div class="flex items-center"><span class="mr-1 h-4 w-4 text-purple-400">⬤</span>8650</div>
			<div class="flex items-center"><span class="mr-1 h-4 w-4 text-green-400">⬤</span>4.30M</div>
			<div class="flex items-center"><span class="mr-1 h-4 w-4 text-orange-400">⬤</span>1368</div>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-sm font-semibold">meitbe</span>
			<span class="relative inline-block">
				<span class="grid h-6 w-6 place-items-center text-gray-400">✉️</span>
				<span
					class="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-red-100"
					>7</span
				>
			</span>
		</div>
	</div>

	<!-- pages container -->
	<div class="absolute inset-0 z-[2] pt-[68px] pb-[60px]">
		<!-- Home -->
		{#if activePage === 'home'}
			<div class="h-full overflow-y-auto p-4 [scrollbar-width:thin]">
				<h1
					class="mb-6 text-center text-2xl font-bold text-cyan-300 [text-shadow:0_0_8px_rgba(0,255,255,.6)]"
				>
					PLANET BASE
				</h1>
				<div class="grid grid-cols-2 gap-4">
					{#each Array(4) as _, i}
						<div
							class="relative flex flex-col items-center overflow-hidden rounded-lg border border-slate-600 bg-gradient-to-b from-gray-800 to-gray-700 p-3 text-center shadow transition hover:-translate-y-1"
						>
							<div
								class="pointer-events-none absolute inset-0 bg-[linear-gradient(45deg,rgba(0,255,255,.1)_0%,transparent_50%,rgba(0,255,255,.1)_100%)] opacity-30"
							></div>
							<img
								alt="building"
								class="h-20 w-full object-contain"
								src={`https://placehold.co/200x80/1f2937/a0aec0?text=Building+${i + 1}`}
							/>
							<span class="mt-2 text-sm font-semibold text-blue-200">Lv. {Math.min(9, i + 4)}</span>
						</div>
					{/each}
				</div>

				<div class="mt-6">
					<h2 class="mb-2 text-lg font-semibold text-cyan-200">Build Queue</h2>
					{#if builds.length === 0}
						<div class="text-sm text-gray-400">No builds queued.</div>
					{:else}
						<div class="space-y-2">
							{#each builds as b}
								<div
									class="flex items-center justify-between rounded border border-slate-700 bg-slate-800 p-2 text-sm text-blue-200"
								>
									<div>
										<div class="font-semibold">{b.type ?? 'ship'}</div>
										<div class="text-xs text-gray-400">{b.status} · {b.createdAt}</div>
									</div>
									<div class="text-xs">{b.remainingSeconds ?? b.durationSeconds ?? '–'}s</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Planets -->
		{#if activePage === 'planets'}
			<div class="h-full overflow-y-auto p-4">
				<h1
					class="mb-6 text-center text-2xl font-bold text-cyan-300 [text-shadow:0_0_8px_rgba(0,255,255,.6)]"
				>
					EXPLORE THE GALAXY
				</h1>

				<div
					class="mb-6 flex items-center gap-1 rounded-full border border-blue-700 bg-gradient-to-r from-blue-900 to-blue-950 p-1 shadow-lg"
				>
					<button
						class="flex-1 rounded-full py-2 text-sm font-semibold text-gray-300 shadow-inner transition"
						class:!bg-gradient-to-b={planetsTab === 'galaxy'}
						class:from-cyan-400={planetsTab === 'galaxy'}
						class:to-blue-600={planetsTab === 'galaxy'}
						on:click={() => (planetsTab = 'galaxy')}>Galaxy</button
					>
					<button
						class="flex-1 rounded-full py-2 text-sm font-semibold text-gray-300 shadow-inner transition"
						class:!bg-gradient-to-b={planetsTab === 'system'}
						class:from-cyan-400={planetsTab === 'system'}
						class:to-blue-600={planetsTab === 'system'}
						on:click={() => (planetsTab = 'system')}>System</button
					>
				</div>

				{#if planetsTab === 'galaxy'}
					<div class="grid grid-cols-2 gap-4">
						{#each Array(6) as _, i}
							<div
								class="relative flex flex-col items-center overflow-hidden rounded-lg border border-slate-600 bg-gradient-to-b from-gray-800 to-gray-700 p-3 text-center shadow transition hover:-translate-y-1"
							>
								<div
									class="pointer-events-none absolute inset-0 bg-[linear-gradient(45deg,rgba(0,255,255,.1)_0%,transparent_50%,rgba(0,255,255,.1)_100%)] opacity-30"
								></div>
								<img
									alt="galaxy"
									class="h-20 w-full object-contain"
									src={`https://placehold.co/200x80/1f2937/a0aec0?text=Galaxy+${i + 1}`}
								/>
								<span class="mt-2 text-sm font-semibold text-blue-200">Galaxy #{i + 1}</span>
							</div>
						{/each}
					</div>
				{:else}
					<div class="space-y-4">
						<div
							class="rounded-lg border border-blue-700 bg-gradient-to-r from-blue-900 to-blue-950 p-3 shadow"
						>
							<div class="flex items-center justify-between text-sm text-blue-200">
								<span>System: 3-17</span>
								<button
									class="rounded-md border border-cyan-400 px-3 py-1 text-cyan-300 hover:bg-cyan-400/10"
									on:click={() => (showDeployModal = true)}>Deploy</button
								>
							</div>
						</div>
						<div class="flex items-center justify-center gap-6 py-6">
							<img
								class="h-36 w-36 rounded-full border-2 border-cyan-400 object-cover shadow-[0_0_15px_rgba(0,255,255,.4)]"
								src="https://placehold.co/150x150/0b1730/7dd3fc?text=Planet"
								alt="Planet"
							/>
						</div>
						<div
							class="rounded-lg border border-blue-700 bg-gradient-to-r from-blue-900 to-blue-950 p-4 text-center shadow"
						>
							<div class="text-sm text-blue-200">Planet: Nereid · Pop: 3.2M · Ore: Rich</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Fleet -->
		{#if activePage === 'fleet'}
			<div class="h-full overflow-y-auto p-4">
				<h1
					class="mb-6 text-center text-2xl font-bold text-cyan-300 [text-shadow:0_0_8px_rgba(0,255,255,.6)]"
				>
					BUILD YOUR FLEET
				</h1>

				<div
					class="mb-6 flex items-center gap-1 rounded-full border border-blue-700 bg-gradient-to-r from-blue-900 to-blue-950 p-1 shadow-lg"
				>
					<button
						class="flex-1 rounded-full py-2 text-sm font-semibold text-gray-300 shadow-inner transition"
						class:!bg-gradient-to-b={fleetTab === 'dispatch'}
						class:from-cyan-400={fleetTab === 'dispatch'}
						class:to-blue-600={fleetTab === 'dispatch'}
						on:click={() => (fleetTab = 'dispatch')}>Dispatch</button
					>
					<button
						class="flex-1 rounded-full py-2 text-sm font-semibold text-gray-300 shadow-inner transition"
						class:!bg-gradient-to-b={fleetTab === 'inflight'}
						class:from-cyan-400={fleetTab === 'inflight'}
						class:to-blue-600={fleetTab === 'inflight'}
						on:click={() => (fleetTab = 'inflight')}>In Flight</button
					>
				</div>

				{#if fleetTab === 'dispatch'}
					<div class="grid grid-cols-2 gap-4 pb-4">
						{#each Array(6) as _, i}
							<div
								class="relative flex flex-col items-center justify-between overflow-hidden rounded-lg border border-slate-600 bg-gradient-to-b from-gray-800 to-gray-700 p-3 text-center shadow transition hover:-translate-y-1"
							>
								<div
									class="pointer-events-none absolute inset-0 bg-[linear-gradient(45deg,rgba(0,255,255,.1)_0%,transparent_50%,rgba(0,255,255,.1)_100%)] opacity-30"
								></div>
								<img
									alt="ship"
									class="h-20 w-full object-contain"
									src={`https://placehold.co/200x80/1f2937/a0aec0?text=Ship+${i + 1}`}
								/>
								<div class="mt-2 text-sm font-semibold text-blue-200">Class {i + 1}</div>
								<button
									class="mt-2 rounded-md border border-cyan-400 px-3 py-1 text-cyan-300 hover:bg-cyan-400/10"
									on:click={() => postBuild('scout', 1)}>Build</button
								>
							</div>
						{/each}
					</div>
				{:else}
					<div class="space-y-3">
						<h2 class="text-lg font-semibold text-cyan-200">In Flight</h2>
						{#if fleets.length === 0}
							<div class="text-sm text-gray-400">No fleets currently in flight.</div>
						{:else}
							<div class="space-y-2">
								{#each fleets as f}
									<div
										class="rounded border border-slate-700 bg-slate-800 p-2 text-sm text-blue-200"
									>
										<div class="flex items-center justify-between">
											<div>
												<div class="font-semibold">Fleet {f.id}</div>
												<div class="text-xs text-gray-400">
													{f.status} · {new Date(f.createdAt).toLocaleTimeString()}
												</div>
											</div>
											<div class="text-xs">ETA: {f.etaSeconds}s</div>
										</div>
										{#if f.combat}
											<div class="mt-2 text-xs text-gray-300">
												<div>
													Combat result: {f.combat.attackerWins
														? 'Attacker victory'
														: 'Defender victory'}
												</div>
												<div>
													Attacker losses: {f.combat.attackerLosses} · Defender losses: {f.combat
														.defenderLosses}
												</div>
												<div class="mt-1 text-[11px] text-gray-500">Seed: {f.combat.seed}</div>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				<div
					class="mt-4 rounded-t-xl border-t-2 border-blue-700 bg-gradient-to-t from-blue-900 to-blue-950 p-3 shadow-xl"
				>
					<div class="mb-2 flex items-center justify-between text-sm font-semibold text-blue-300">
						<span>Destination</span>
						<span>—</span>
					</div>
					<div class="flex items-center gap-2">
						<input
							class="flex-1 rounded border border-blue-700 bg-transparent px-2 py-1 text-sm"
							placeholder="Galaxy-System-Planet"
						/>
						<button
							class="rounded-md border border-cyan-400 px-3 py-1 text-cyan-300 hover:bg-cyan-400/10"
							on:click={() => dispatchFleet()}>Send</button
						>
					</div>
				</div>
			</div>
		{/if}

		<!-- Galactonite -->
		{#if activePage === 'galactonite'}
			<div class="h-full overflow-y-auto p-4">
				<h1
					class="mb-6 text-center text-2xl font-bold text-cyan-300 [text-shadow:0_0_8px_rgba(0,255,255,.6)]"
				>
					GALACTONITE FUSER
				</h1>
				<div
					class="mb-4 rounded-lg border border-blue-700 bg-gradient-to-r from-blue-900 to-blue-950 p-4 text-center shadow-lg"
				>
					<span class="text-sm text-gray-300">Select to start with 20 times.</span>
				</div>
				<div class="grid grid-cols-4 gap-2">
					{#each Array(12) as _, i}
						<div
							class="relative aspect-square overflow-hidden rounded-md border border-slate-600 bg-gradient-to-b from-gray-800 to-gray-700 shadow"
						>
							<div
								class="pointer-events-none absolute inset-0 bg-[linear-gradient(45deg,rgba(0,255,255,.1)_0%,transparent_50%,rgba(0,255,255,.1)_100%)] opacity-30"
							></div>
							<img
								class="h-full w-full object-contain p-2"
								alt="galactonite"
								src={`https://placehold.co/80x80/111827/a0aec0?text=G${i + 1}`}
							/>
						</div>
					{/each}
				</div>
				<button
					class="mt-4 w-full rounded-md border border-red-500 bg-red-700 py-2 font-bold text-red-100 shadow hover:bg-red-600"
					>Decompose All</button
				>
			</div>
		{/if}

		<!-- Capsule -->
		{#if activePage === 'capsule'}
			<div class="h-full overflow-y-auto p-4 pt-8 text-center">
				<h1 class="mb-6 text-2xl font-bold text-cyan-300 [text-shadow:0_0_8px_rgba(0,255,255,.6)]">
					CAPSULE
				</h1>
				<p class="text-gray-400">Content for Capsule page will go here.</p>
				<img
					src="https://placehold.co/200x150/1c212e/a0aec0?text=Capsule+Coming+Soon"
					alt="Capsule Page"
					class="mx-auto mt-4 rounded-lg opacity-70"
				/>
			</div>
		{/if}
	</div>

	<!-- deploy modal -->
	{#if showDeployModal}
		<div class="absolute inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur">
			<div
				class="w-[90%] max-w-[350px] animate-[fadeIn_.2s_ease-out] rounded-xl border-2 border-cyan-400 bg-gradient-to-b from-slate-900 to-slate-800 p-4 shadow-[0_0_20px_rgba(0,255,255,.5)]"
			>
				<div class="mb-3 font-semibold text-cyan-200">Deploy Fleet</div>
				<div class="space-y-2 text-sm text-blue-100">
					<div class="flex items-center gap-2">
						<span class="opacity-80">System:</span><span>3-17</span>
					</div>
					<div class="flex items-center gap-2">
						<span class="opacity-80">Planet:</span><span>Nereid</span>
					</div>
				</div>
				<div class="mt-4 flex justify-end gap-2">
					<button
						class="rounded-md border border-slate-500 px-3 py-1 hover:bg-white/5"
						on:click={() => (showDeployModal = false)}>Cancel</button
					>
					<button
						class="rounded-md border border-cyan-400 px-3 py-1 text-cyan-300 hover:bg-cyan-400/10"
						on:click={() => {
							dispatchFleet();
							showDeployModal = false;
						}}>Deploy</button
					>
				</div>
			</div>
		</div>
	{/if}

	{#if toast}
		<div
			class="absolute top-6 left-1/2 z-50 -translate-x-1/2 rounded bg-black/70 px-4 py-2 text-white"
		>
			{toast}
		</div>
	{/if}

	<!-- bottom nav -->
	<div
		class="absolute right-0 bottom-0 left-0 z-[3] flex w-full items-center justify-around rounded-t-xl border-t-2 border-blue-700 bg-gradient-to-t from-blue-950 to-blue-900 p-2 text-xs font-semibold text-gray-400 shadow-2xl"
	>
		<button
			class="flex flex-col items-center rounded-md p-2 hover:bg-blue-800"
			class:!bg-blue-800={activePage === 'home'}
			on:click={() => setPage('home')}
		>
			<span class="text-lg" class:text-cyan-300={activePage === 'home'}>🏠</span>
			<span>Home</span>
		</button>
		<button
			class="flex flex-col items-center rounded-md p-2 hover:bg-blue-800"
			class:!bg-blue-800={activePage === 'planets'}
			on:click={() => setPage('planets')}
		>
			<span class="text-lg" class:text-cyan-300={activePage === 'planets'}>🪐</span>
			<span>Planets</span>
		</button>
		<button
			class="flex flex-col items-center rounded-md p-2 hover:bg-blue-800"
			class:!bg-blue-800={activePage === 'fleet'}
			on:click={() => setPage('fleet')}
		>
			<span class="text-lg" class:text-cyan-300={activePage === 'fleet'}>🚀</span>
			<span>Fleet</span>
		</button>
		<button
			class="flex flex-col items-center rounded-md p-2 hover:bg-blue-800"
			class:!bg-blue-800={activePage === 'galactonite'}
			on:click={() => setPage('galactonite')}
		>
			<span class="text-lg" class:text-cyan-300={activePage === 'galactonite'}>💎</span>
			<span>Galactonite</span>
		</button>
		<button
			class="flex flex-col items-center rounded-md p-2 hover:bg-blue-800"
			class:!bg-blue-800={activePage === 'capsule'}
			on:click={() => setPage('capsule')}
		>
			<span class="text-lg" class:text-cyan-300={activePage === 'capsule'}>📦</span>
			<span>Capsule</span>
		</button>
	</div>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
