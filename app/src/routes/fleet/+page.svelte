<script lang="ts">
  import { onMount } from 'svelte';
  let state: any = null;
  let missions: any[] = [];
  let error = '';

  async function load() {
    const res = await fetch('/api/player/state');
    if (res.ok) state = (await res.json()).state;
    const m = await fetch('/api/missions');
    if (m.ok) missions = (await m.json()).missions || [];
  }

  onMount(load);

  async function launch(shipTemplateId: string) {
    const res = await fetch('/api/missions/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ shipTemplateId, quantity: 1 }) });
    if (res.ok) await load();
    else error = 'launch_failed';
  }
</script>

<h2 class="text-2xl font-semibold mb-4">Fleet</h2>
{#if !state}
  <div class="flex justify-center"><progress class="progress w-56"></progress></div>
{:else}
  <section class="mb-6">
    <h3 class="text-lg font-medium">Your Ships</h3>
    {#if state.ships && state.ships.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
        {#each state.ships as s}
          <div class="card p-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">{s.shipTemplateId}</div>
                <div class="text-sm text-muted">Quantity: {s.quantity}</div>
              </div>
              <button class="btn btn-sm btn-primary" on:click={() => launch(s.shipTemplateId)}>Launch</button>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-muted">No ships</p>
    {/if}
  </section>

  <section>
    <h3 class="text-lg font-medium">Missions</h3>
    {#if missions.length === 0}
      <p class="text-muted">No missions</p>
    {:else}
      <div class="space-y-2 mt-3">
        {#each missions as m}
          <div class="card p-3 flex justify-between items-center">
            <div>
              <div class="font-medium">{m.shipTemplateId} x{m.quantity}</div>
              <div class="text-sm text-muted">{m.status} • ETA: {new Date(m.eta).toLocaleString()}</div>
            </div>
            <div class="text-right">
              <span class="badge">{m.status}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
{/if}
