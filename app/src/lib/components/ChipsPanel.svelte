<script lang="ts">
  import { onMount } from 'svelte';
  let chips: Record<string, number> = {};
  let equipped: Record<string, boolean> = {};
  let loading = true;
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
    await fetch('/api/demo/chips/upgrade', { method: 'POST', body: JSON.stringify({ chipId }), headers: { 'Content-Type': 'application/json' } });
    await load();
  }

  async function toggleEquip(chipId: string) {
    await fetch('/api/demo/chips/equip', { method: 'POST', body: JSON.stringify({ chipId }), headers: { 'Content-Type': 'application/json' } });
    await load();
  }
</script>

<div class="card bg-white/10 p-3">
  <h4 class="font-bold mb-2">Chips</h4>
  {#if loading}
    <div class="text-sm text-muted">Loading…</div>
  {:else}
    {#if Object.keys(chips).length === 0}
      <div class="text-sm text-muted">No chips</div>
    {:else}
      <ul class="space-y-1 text-sm">
        {#each Object.entries(chips) as [id, count]}
          <li class="flex items-center justify-between gap-3">
            <div class="flex-1">
              <div class="font-medium">{id.replace(/([A-Z])/g, ' $1')}</div>
              <div class="text-sm text-muted">Count: {count}</div>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-xs btn-ghost" on:click={() => upgrade(id)}>Upgrade</button>
              <button class="btn btn-xs" class:btn-info={equipped[id]} on:click={() => toggleEquip(id)}>{equipped[id] ? 'Unequip' : 'Equip'}</button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>
