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
      const [bRes, fRes] = await Promise.all([fetch('/api/demo/builds'), fetch('/api/demo/fleets')]);
      if (bRes.ok) builds = (await bRes.json()).builds ?? [];
      if (fRes.ok) fleets = (await fRes.json()).fleets ?? [];
    } catch {
      // ignore
    }
  }

  function startPolling() {
    if (pollId) return;
    pollId = (globalThis as any).setInterval(() => loadQueues(), 5000) as number;
    loadQueues();
  }

  function stopPolling() {
    if (pollId) { clearInterval(pollId); pollId = null; }
  }

  // start polling when the page is mounted
  startPolling();

  async function postBuild(type = 'scout', count = 1) {
    try {
      const res = await fetch('/api/demo/builds', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, count }) });
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
    setTimeout(() => toast = null, 2500);
  }

  async function dispatchFleet(destination = '3-17-Nereid') {
    try {
      const res = await fetch('/api/demo/fleet/dispatch', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ destination, etaSeconds: 30, ships: { scout: 3 } }) });
      if (res.ok) {
        toast = 'Fleet dispatched';
        window.dispatchEvent(new CustomEvent('demo:changed'));
      } else {
        toast = 'Dispatch failed';
      }
    } catch {
      toast = 'Dispatch failed';
    }
    setTimeout(() => toast = null, 2500);
  }

  function setPage(p: typeof activePage) {
    activePage = p;
    if (p === 'fleet') fleetTab = 'dispatch';
    if (p === 'planets') planetsTab = 'galaxy';
  }
</script>

<!-- Phone mockup container -->
<div class="relative w-full max-w-[400px] h-[90dvh] max-h-[800px] rounded-[3rem] border-8 border-black shadow-[0_0_40px_rgba(0,255,255,.5),_inset_0_0_20px_rgba(0,0,0,.8)] overflow-hidden" style="background-image:url('https://placehold.co/400x800/1e293b/a0aec0?text=SPACE+BACKGROUND');background-size:cover;background-position:center;">
  <!-- gradient overlay -->
  <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-[1]"></div>

  <!-- top bar -->
  <div class="relative z-[2] p-4 flex items-center justify-between bg-gradient-to-b from-blue-900 to-blue-950 rounded-b-xl border-b-2 border-blue-700 shadow-xl">
    <span class="text-xs text-gray-400">1318</span>
    <div class="flex items-center gap-2 text-blue-300 text-sm font-bold">
      <div class="flex items-center"><span class="w-4 h-4 mr-1 text-yellow-400">⬤</span>9.21M</div>
      <div class="flex items-center"><span class="w-4 h-4 mr-1 text-purple-400">⬤</span>8650</div>
      <div class="flex items-center"><span class="w-4 h-4 mr-1 text-green-400">⬤</span>4.30M</div>
      <div class="flex items-center"><span class="w-4 h-4 mr-1 text-orange-400">⬤</span>1368</div>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-sm font-semibold">meitbe</span>
      <span class="relative inline-block">
        <span class="w-6 h-6 grid place-items-center text-gray-400">✉️</span>
        <span class="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-red-100 bg-red-600 rounded-full">7</span>
      </span>
    </div>
  </div>

  <!-- pages container -->
  <div class="absolute inset-0 pt-[68px] pb-[60px] z-[2]">
    <!-- Home -->
    {#if activePage === 'home'}
      <div class="h-full p-4 overflow-y-auto [scrollbar-width:thin]">
        <h1 class="text-2xl font-bold text-center mb-6 text-cyan-300 [text-shadow:0_0_8px_rgba(0,255,255,.6)]">PLANET BASE</h1>
        <div class="grid grid-cols-2 gap-4">
          {#each Array(4) as _, i}
            <div class="p-3 text-center flex flex-col items-center rounded-lg bg-gradient-to-b from-gray-800 to-gray-700 border border-slate-600 relative overflow-hidden shadow hover:-translate-y-1 transition">
              <div class="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(45deg,rgba(0,255,255,.1)_0%,transparent_50%,rgba(0,255,255,.1)_100%)]"></div>
              <img alt="building" class="w-full h-20 object-contain" src={`https://placehold.co/200x80/1f2937/a0aec0?text=Building+${i+1}`}/>
              <span class="mt-2 text-sm font-semibold text-blue-200">Lv. {Math.min(9, i+4)}</span>
            </div>
          {/each}
        </div>

        <div class="mt-6">
          <h2 class="text-lg font-semibold text-cyan-200 mb-2">Build Queue</h2>
          {#if builds.length === 0}
            <div class="text-sm text-gray-400">No builds queued.</div>
          {:else}
            <div class="space-y-2">
              {#each builds as b}
                <div class="p-2 rounded bg-slate-800 border border-slate-700 text-sm text-blue-200 flex justify-between items-center">
                  <div>
                    <div class="font-semibold">{b.type ?? 'ship'}</div>
                    <div class="text-xs text-gray-400">{b.status} · {b.createdAt}</div>
                  </div>
                  <div class="text-xs">{b.remainingSeconds ?? b.durationSeconds ?? '–' }s</div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Planets -->
    {#if activePage === 'planets'}
      <div class="h-full p-4 overflow-y-auto">
        <h1 class="text-2xl font-bold text-center mb-6 text-cyan-300 [text-shadow:0_0_8px_rgba(0,255,255,.6)]">EXPLORE THE GALAXY</h1>

        <div class="bg-gradient-to-r from-blue-900 to-blue-950 p-1 rounded-full flex items-center gap-1 mb-6 border border-blue-700 shadow-lg">
          <button class="flex-1 py-2 rounded-full text-sm font-semibold text-gray-300 transition shadow-inner" class:!bg-gradient-to-b={planetsTab==='galaxy'} class:from-cyan-400={planetsTab==='galaxy'} class:to-blue-600={planetsTab==='galaxy'} on:click={() => planetsTab='galaxy'}>Galaxy</button>
          <button class="flex-1 py-2 rounded-full text-sm font-semibold text-gray-300 transition shadow-inner" class:!bg-gradient-to-b={planetsTab==='system'} class:from-cyan-400={planetsTab==='system'} class:to-blue-600={planetsTab==='system'} on:click={() => planetsTab='system'}>System</button>
        </div>

        {#if planetsTab === 'galaxy'}
          <div class="grid grid-cols-2 gap-4">
            {#each Array(6) as _, i}
              <div class="p-3 text-center flex flex-col items-center rounded-lg bg-gradient-to-b from-gray-800 to-gray-700 border border-slate-600 relative overflow-hidden shadow hover:-translate-y-1 transition">
                <div class="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(45deg,rgba(0,255,255,.1)_0%,transparent_50%,rgba(0,255,255,.1)_100%)]"></div>
                <img alt="galaxy" class="w-full h-20 object-contain" src={`https://placehold.co/200x80/1f2937/a0aec0?text=Galaxy+${i+1}`}/>
                <span class="mt-2 text-sm font-semibold text-blue-200">Galaxy #{i+1}</span>
              </div>
            {/each}
          </div>
        {:else}
          <div class="space-y-4">
            <div class="bg-gradient-to-r from-blue-900 to-blue-950 p-3 rounded-lg border border-blue-700 shadow">
              <div class="flex items-center justify-between text-sm text-blue-200">
                <span>System: 3-17</span>
                <button class="px-3 py-1 rounded-md border border-cyan-400 text-cyan-300 hover:bg-cyan-400/10" on:click={() => showDeployModal = true}>Deploy</button>
              </div>
            </div>
            <div class="flex items-center justify-center gap-6 py-6">
              <img class="w-36 h-36 rounded-full object-cover border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,.4)]" src="https://placehold.co/150x150/0b1730/7dd3fc?text=Planet" alt="Planet" />
            </div>
            <div class="bg-gradient-to-r from-blue-900 to-blue-950 p-4 rounded-lg border border-blue-700 shadow text-center">
              <div class="text-sm text-blue-200">Planet: Nereid · Pop: 3.2M · Ore: Rich</div>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Fleet -->
    {#if activePage === 'fleet'}
      <div class="h-full p-4 overflow-y-auto">
        <h1 class="text-2xl font-bold text-center mb-6 text-cyan-300 [text-shadow:0_0_8px_rgba(0,255,255,.6)]">BUILD YOUR FLEET</h1>

        <div class="bg-gradient-to-r from-blue-900 to-blue-950 p-1 rounded-full flex items-center gap-1 mb-6 border border-blue-700 shadow-lg">
          <button class="flex-1 py-2 rounded-full text-sm font-semibold text-gray-300 transition shadow-inner" class:!bg-gradient-to-b={fleetTab==='dispatch'} class:from-cyan-400={fleetTab==='dispatch'} class:to-blue-600={fleetTab==='dispatch'} on:click={() => fleetTab='dispatch'}>Dispatch</button>
          <button class="flex-1 py-2 rounded-full text-sm font-semibold text-gray-300 transition shadow-inner" class:!bg-gradient-to-b={fleetTab==='inflight'} class:from-cyan-400={fleetTab==='inflight'} class:to-blue-600={fleetTab==='inflight'} on:click={() => fleetTab='inflight'}>In Flight</button>
        </div>

        {#if fleetTab === 'dispatch'}
          <div class="grid grid-cols-2 gap-4 pb-4">
            {#each Array(6) as _, i}
              <div class="p-3 text-center flex flex-col items-center justify-between rounded-lg bg-gradient-to-b from-gray-800 to-gray-700 border border-slate-600 relative overflow-hidden shadow hover:-translate-y-1 transition">
                <div class="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(45deg,rgba(0,255,255,.1)_0%,transparent_50%,rgba(0,255,255,.1)_100%)]"></div>
                <img alt="ship" class="w-full h-20 object-contain" src={`https://placehold.co/200x80/1f2937/a0aec0?text=Ship+${i+1}`}/>
                <div class="mt-2 text-sm font-semibold text-blue-200">Class {i+1}</div>
                <button class="mt-2 px-3 py-1 rounded-md border border-cyan-400 text-cyan-300 hover:bg-cyan-400/10" on:click={() => postBuild('scout', 1)}>Build</button>
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
                  <div class="p-2 rounded bg-slate-800 border border-slate-700 text-sm text-blue-200">
                    <div class="flex justify-between items-center">
                      <div>
                        <div class="font-semibold">Fleet {f.id}</div>
                        <div class="text-xs text-gray-400">{f.status} · {new Date(f.createdAt).toLocaleTimeString()}</div>
                      </div>
                      <div class="text-xs">ETA: {f.etaSeconds}s</div>
                    </div>
                    {#if f.combat}
                      <div class="mt-2 text-xs text-gray-300">
                        <div>Combat result: {f.combat.attackerWins ? 'Attacker victory' : 'Defender victory'}</div>
                        <div>Attacker losses: {f.combat.attackerLosses} · Defender losses: {f.combat.defenderLosses}</div>
                        <div class="mt-1 text-[11px] text-gray-500">Seed: {f.combat.seed}</div>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        <div class="bg-gradient-to-t from-blue-900 to-blue-950 p-3 rounded-t-xl border-t-2 border-blue-700 mt-4 shadow-xl">
          <div class="flex items-center justify-between text-sm mb-2 text-blue-300 font-semibold">
            <span>Destination</span>
            <span>—</span>
          </div>
          <div class="flex items-center gap-2">
            <input class="flex-1 bg-transparent border border-blue-700 rounded px-2 py-1 text-sm" placeholder="Galaxy-System-Planet" />
            <button class="px-3 py-1 rounded-md border border-cyan-400 text-cyan-300 hover:bg-cyan-400/10" on:click={() => dispatchFleet()}>Send</button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Galactonite -->
    {#if activePage === 'galactonite'}
      <div class="h-full p-4 overflow-y-auto">
        <h1 class="text-2xl font-bold text-center mb-6 text-cyan-300 [text-shadow:0_0_8px_rgba(0,255,255,.6)]">GALACTONITE FUSER</h1>
        <div class="bg-gradient-to-r from-blue-900 to-blue-950 p-4 rounded-lg border border-blue-700 shadow-lg mb-4 text-center">
          <span class="text-sm text-gray-300">Select to start with 20 times.</span>
        </div>
        <div class="grid grid-cols-4 gap-2">
          {#each Array(12) as _, i}
            <div class="aspect-square rounded-md bg-gradient-to-b from-gray-800 to-gray-700 border border-slate-600 relative overflow-hidden shadow">
              <div class="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(45deg,rgba(0,255,255,.1)_0%,transparent_50%,rgba(0,255,255,.1)_100%)]"></div>
              <img class="w-full h-full object-contain p-2" alt="galactonite" src={`https://placehold.co/80x80/111827/a0aec0?text=G${i+1}`}/>
            </div>
          {/each}
        </div>
        <button class="w-full mt-4 py-2 bg-red-700 text-red-100 rounded-md font-bold border border-red-500 shadow hover:bg-red-600">Decompose All</button>
      </div>
    {/if}

    <!-- Capsule -->
    {#if activePage === 'capsule'}
      <div class="h-full p-4 overflow-y-auto text-center pt-8">
        <h1 class="text-2xl font-bold text-cyan-300 [text-shadow:0_0_8px_rgba(0,255,255,.6)] mb-6">CAPSULE</h1>
        <p class="text-gray-400">Content for Capsule page will go here.</p>
        <img src="https://placehold.co/200x150/1c212e/a0aec0?text=Capsule+Coming+Soon" alt="Capsule Page" class="mx-auto mt-4 rounded-lg opacity-70" />
      </div>
    {/if}
  </div>

  <!-- deploy modal -->
  {#if showDeployModal}
    <div class="absolute inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur">
      <div class="w-[90%] max-w-[350px] rounded-xl border-2 border-cyan-400 bg-gradient-to-b from-slate-900 to-slate-800 p-4 shadow-[0_0_20px_rgba(0,255,255,.5)] animate-[fadeIn_.2s_ease-out]">
        <div class="font-semibold text-cyan-200 mb-3">Deploy Fleet</div>
        <div class="space-y-2 text-sm text-blue-100">
          <div class="flex items-center gap-2"><span class="opacity-80">System:</span><span>3-17</span></div>
          <div class="flex items-center gap-2"><span class="opacity-80">Planet:</span><span>Nereid</span></div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="px-3 py-1 rounded-md border border-slate-500 hover:bg-white/5" on:click={() => showDeployModal = false}>Cancel</button>
          <button class="px-3 py-1 rounded-md border border-cyan-400 text-cyan-300 hover:bg-cyan-400/10" on:click={() => { dispatchFleet(); showDeployModal = false; }}>Deploy</button>
        </div>
      </div>
    </div>
  {/if}

  {#if toast}
    <div class="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white px-4 py-2 rounded">{toast}</div>
  {/if}

  <!-- bottom nav -->
  <div class="absolute bottom-0 left-0 right-0 z-[3] w-full p-2 bg-gradient-to-t from-blue-950 to-blue-900 rounded-t-xl border-t-2 border-blue-700 flex justify-around items-center text-xs text-gray-400 font-semibold shadow-2xl">
    <button class="flex flex-col items-center p-2 rounded-md hover:bg-blue-800" class:!bg-blue-800={activePage==='home'} on:click={() => setPage('home')}>
      <span class="text-lg" class:text-cyan-300={activePage==='home'}>🏠</span>
      <span>Home</span>
    </button>
    <button class="flex flex-col items-center p-2 rounded-md hover:bg-blue-800" class:!bg-blue-800={activePage==='planets'} on:click={() => setPage('planets')}>
      <span class="text-lg" class:text-cyan-300={activePage==='planets'}>🪐</span>
      <span>Planets</span>
    </button>
    <button class="flex flex-col items-center p-2 rounded-md hover:bg-blue-800" class:!bg-blue-800={activePage==='fleet'} on:click={() => setPage('fleet')}>
      <span class="text-lg" class:text-cyan-300={activePage==='fleet'}>🚀</span>
      <span>Fleet</span>
    </button>
    <button class="flex flex-col items-center p-2 rounded-md hover:bg-blue-800" class:!bg-blue-800={activePage==='galactonite'} on:click={() => setPage('galactonite')}>
      <span class="text-lg" class:text-cyan-300={activePage==='galactonite'}>💎</span>
      <span>Galactonite</span>
    </button>
    <button class="flex flex-col items-center p-2 rounded-md hover:bg-blue-800" class:!bg-blue-800={activePage==='capsule'} on:click={() => setPage('capsule')}>
      <span class="text-lg" class:text-cyan-300={activePage==='capsule'}>📦</span>
      <span>Capsule</span>
    </button>
  </div>
</div>

<style>
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px);} to { opacity: 1; transform: translateY(0);} }
</style>
