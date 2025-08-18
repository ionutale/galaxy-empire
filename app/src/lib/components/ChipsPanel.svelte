<script lang="ts">
  import { onMount } from 'svelte';
  let chips: Record<string, number> = {};
  let loading = true;
  async function load() {
    loading = true;
    const res = await fetch('/api/player/state');
    if (res.ok) {
      const body = await res.json();
      chips = body.state.chips || {};
    }
    loading = false;
  }
  onMount(load);
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
          <li class="flex justify-between"><span class="capitalize">{id.replace(/([A-Z])/g, ' $1')}</span><span class="badge">{count}</span></li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>
