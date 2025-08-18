<script lang="ts">
  import { onMount } from 'svelte';
  let state: any = null;
  let error = '';

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
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="card bg-base-200 p-4">
      <h3 class="text-lg font-semibold">Commander: {state.username}</h3>
      <p class="text-sm text-muted">Level: {state.level} · Power: {state.power}</p>
      <div class="divider" />
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
      <div class="divider" />
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
{/if}
