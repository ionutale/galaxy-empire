<script lang="ts">
  import { onMount } from 'svelte';
  import { BUILDING_DATA, RESEARCH_DATA } from '$lib/data/gameData';
  import BuildingIcon from '$lib/icons/BuildingIcon.svelte';
  let state: any = null;
  let error = '';
  let upgrading = new Set<string>();

  // UI modal state for building details
  let selectedBuilding: string | null = null;
  let showModal = false;

  // BuildingIcon component provides consistent SVG icons for buildings

  // format requirement objects into human-friendly lines
  function formatRequirements(req: any) {
    if (!req) return ['None'];
    const lines: string[] = [];
    if (req.building) {
      const name = BUILDING_DATA[req.building]?.name ?? req.building;
      lines.push(`${name} — level ≥ ${req.level ?? 1}`);
    }
    if (req.research) {
      const rname = RESEARCH_DATA[req.research]?.name ?? req.research;
      lines.push(`Research: ${rname} — level ≥ ${req.level ?? 1}`);
    }
    if (Object.keys(req).length === 0) return ['None'];
    return lines.length ? lines : [JSON.stringify(req)];
  }

  function openBuilding(id: string) {
    selectedBuilding = id;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    selectedBuilding = null;
  }

  // computed helper used by modal template
  $: nextLevel = selectedBuilding ? ((state?.buildings?.[selectedBuilding] ?? 0) + 1) : 1;

  onMount(async () => {
    const res = await fetch('/api/player/state');
    if (res.ok) {
      const body = await res.json();
      state = body.state;
    } else {
      error = 'unauthenticated';
    }
  });

  async function processBuilds() {
    const res = await fetch('/api/shipyard/process', { method: 'POST' });
    if (res.ok) {
      const b = await res.json();
      await new Promise((r) => setTimeout(r, 200));
      const r2 = await fetch('/api/player/state');
      state = (await r2.json()).state;
    } else {
      error = 'process_failed';
    }
  }

  async function upgradeBuilding(id: string) {
    if (upgrading.has(id)) return;
    upgrading.add(id);
    const res = await fetch('/api/demo/buildings/upgrade', { method: 'POST', body: JSON.stringify({ buildingId: id }), headers: { 'Content-Type': 'application/json' } });
    if (res.ok) {
      state = (await res.json()).state;
      import('$lib/stores/toast').then((m) => m.pushToast(`${id} upgraded`, 'success'));
    } else {
      import('$lib/stores/toast').then((m) => m.pushToast(`Upgrade failed`, 'error'));
    }
    upgrading.delete(id);
  }
</script>

{#if error}
  <div class="alert alert-warning">
    <div>
      <span>{error} —</span>
      <a class="link" href="/login"> login</a>
      <span> or </span>
      <a class="link" href="/register">register</a>
    </div>
  </div>
{:else if !state}
  <div class="flex justify-center"><progress class="progress w-56"></progress></div>
{:else}
  <div class="container mx-auto p-4">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div class="card bg-base-200 p-4">
        <h3 class="text-lg font-semibold">Commander: {state.username}</h3>
        <p class="text-sm text-muted">Level: {state.level} · Power: {state.power}</p>
        <div class="divider"></div>
        <h4 class="font-medium">Resources</h4>
        <ul class="space-y-1 mt-2">
          <li class="badge badge-outline">Credits: {state.resources.credits}</li>
          <li class="badge badge-outline">Metal: {state.resources.metal}</li>
          <li class="badge badge-outline">Crystal: {state.resources.crystal}</li>
          <li class="badge badge-outline">Fuel: {state.resources.fuel}</li>
        </ul>
      </div>

      <div class="card col-span-2 bg-base-200 p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Ships</h3>
          <button class="btn btn-sm btn-secondary" on:click={processBuilds}>Process builds</button>
        </div>
        <div class="divider"></div>
        {#if state.ships && state.ships.length > 0}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {#each state.ships as s}
              <div class="card p-3 shadow-sm">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">{s.shipTemplateId}</div>
                    <div class="text-sm text-muted">Quantity: {s.quantity}</div>
                  </div>
                  <div>
                    <span class="badge badge-info">x{s.quantity}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-muted">No ships yet.</p>
        {/if}
      </div>
    </div>

    <div>
      <h3 class="text-2xl font-bold mb-4">Base Buildings</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each Object.keys(BUILDING_DATA) as bid}
          {#if BUILDING_DATA[bid]}
            <div
              class="card bg-base-200 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              role="button"
              tabindex="0"
              on:click={() => openBuilding(bid)}
              on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openBuilding(bid);
                }
              }}
            >
              <div class="p-4">
                <div class="flex items-center gap-4">
                  <div class="text-4xl text-primary">
                    <BuildingIcon id={bid} className="text-4xl" />
                  </div>
                  <div>
                    <h4 class="font-bold text-lg">{BUILDING_DATA[bid].name}</h4>
                    <p class="text-sm text-muted">Level {state.buildings?.[bid] ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </div>
{/if}

{#if showModal && selectedBuilding}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" on:click={closeModal}>
    <div
      class="bg-base-100 p-6 rounded-lg w-11/12 max-w-2xl shadow-xl"
      on:click|stopPropagation
    >
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-4">
          <div class="text-5xl text-primary">
            <BuildingIcon id={selectedBuilding!} className="text-5xl" />
          </div>
          <div>
            <h3 class="text-2xl font-bold">{BUILDING_DATA[selectedBuilding].name}</h3>
            <p class="text-md text-muted">
              Level {state.buildings?.[selectedBuilding] ?? 0}
            </p>
          </div>
        </div>
        <button class="btn btn-sm btn-ghost" on:click={closeModal}>✕</button>
      </div>
      <div class="divider my-4"></div>
      <p class="mb-4 text-lg">{BUILDING_DATA[selectedBuilding].description}</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold text-xl mb-2">Benefit</h4>
          <p class="text-md">
            {typeof BUILDING_DATA[selectedBuilding!].benefit === 'function'
              ? (BUILDING_DATA[selectedBuilding!].benefit as any)(
                  state.buildings?.[selectedBuilding!] ?? 0
                )
              : BUILDING_DATA[selectedBuilding!].benefit}
          </p>
        </div>
        <div>
          <h4 class="font-semibold text-xl mb-2">Requirements</h4>
          <div class="text-md">
            <ul class="list-disc list-inside">
              {#each formatRequirements(BUILDING_DATA[selectedBuilding].requires ?? {}) as line}
                <li>{line}</li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
      <div class="divider my-4"></div>
      <div>
        <h4 class="font-semibold text-xl mb-2">Upgrade to Level {nextLevel}</h4>
        <div class="flex items-center justify-between">
          <div>
            {#if BUILDING_DATA[selectedBuilding!].cost}
              <div class="flex gap-4 items-center">
                <div>
                  <p class="font-bold">Cost:</p>
                  <div class="flex gap-2 mt-1">
                    {#each Object.entries(BUILDING_DATA[selectedBuilding!].cost?.(nextLevel) ?? {}) as [res, amt]}
                      <div class="badge badge-secondary">{res}: {amt}</div>
                    {/each}
                  </div>
                </div>
                <div>
                  <p class="font-bold">Time:</p>
                  <p class="mt-1">
                    {BUILDING_DATA[selectedBuilding!].time
                      ? BUILDING_DATA[selectedBuilding!].time(nextLevel) + 's'
                      : '—'}
                  </p>
                </div>
              </div>
            {:else}
              <p class="text-md">No cost data</p>
            {/if}
          </div>
          <div class="flex items-center gap-2">
            <button
              class="btn btn-primary btn-lg"
              on:click={() => {
                upgradeBuilding(selectedBuilding!);
                closeModal();
              }}>Upgrade</button
            >
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
