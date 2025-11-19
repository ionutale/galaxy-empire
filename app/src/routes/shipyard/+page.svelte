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

<h2 class="text-2xl font-semibold mb-4">Shipyard</h2>
{#if error}
  <div class="alert alert-error mb-4">
    <span>{error}</span>
  </div>
{/if}

{#if loading}
  <div class="flex justify-center"><progress class="progress w-56"></progress></div>
{:else}
  {#if playerState?.buildings}
    <div class="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="stats shadow bg-base-200">
        <div class="stat">
          <div class="stat-title">Shipyard Level</div>
          <div class="stat-value text-primary">{playerState.buildings.shipyard ?? 0}</div>
          <div class="stat-desc">Determines build speed</div>
        </div>
      </div>
      <div class="stats shadow bg-base-200">
        <div class="stat">
          <div class="stat-title">Nanite Factory</div>
          <div class="stat-value text-secondary">{playerState.buildings.naniteFactory ?? 0}</div>
          <div class="stat-desc">Reduces build time</div>
        </div>
      </div>
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    {#each templates as t}
      {@const q = qty[t.id] || 1}
      {@const affordable = canAfford(t, q)}
      
      <div class="card bg-base-100 shadow-lg border border-base-300">
        <div class="card-body p-5">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="card-title text-lg">{t.name}</h3>
              <div class="badge badge-ghost badge-sm mt-1">{t.role}</div>
            </div>
            <div class="text-right text-xs opacity-70">
              {t.buildTime}s
            </div>
          </div>

          <div class="divider my-2"></div>

          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="opacity-70">Credits:</span>
              <span class={(playerState?.resources?.credits ?? 0) < (t.costCredits || 0) * q ? 'text-error font-bold' : ''}>
                {(t.costCredits || 0) * q}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="opacity-70">Metal:</span>
              <span class={(playerState?.resources?.metal ?? 0) < (t.costMetal || 0) * q ? 'text-error font-bold' : ''}>
                {(t.costMetal || 0) * q}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="opacity-70">Crystal:</span>
              <span class={(playerState?.resources?.crystal ?? 0) < (t.costCrystal || 0) * q ? 'text-error font-bold' : ''}>
                {(t.costCrystal || 0) * q}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="opacity-70">Fuel:</span>
              <span class={(playerState?.resources?.fuel ?? 0) < (t.costFuel || 0) * q ? 'text-error font-bold' : ''}>
                {(t.costFuel || 0) * q}
              </span>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between gap-2">
            <div class="join">
              <button class="btn btn-sm join-item" on:click={() => qty[t.id] = Math.max(1, (qty[t.id] ?? 1) - 1)}>-</button>
              <input class="input input-sm input-bordered w-14 text-center join-item" bind:value={qty[t.id]} inputmode="numeric" />
              <button class="btn btn-sm join-item" on:click={() => qty[t.id] = Math.min(99, (qty[t.id] ?? 1) + 1)}>+</button>
            </div>
            <button 
              class="btn btn-sm btn-primary flex-1" 
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
