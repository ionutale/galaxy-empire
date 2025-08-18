<script lang="ts">
  import { onMount } from 'svelte';
  type Tech = { id: string; name: string; description?: string };
  let techs: Tech[] = [];
  let loading = true;
  let starting = new Set<string>();
  async function load() {
    loading = true;
  const res = await fetch('/api/demo/research/list');
  if (res.ok) techs = (await res.json()).techs as Tech[];
    loading = false;
  }
  onMount(load);

  async function start(tid: string) {
    if (starting.has(tid)) return;
    starting.add(tid);
    const res = await fetch('/api/demo/research/start', { method: 'POST', body: JSON.stringify({ techId: tid }), headers: { 'Content-Type': 'application/json' } });
    if (res.ok) {
      await load();
      import('$lib/stores/toast').then((m) => m.pushToast(`Research ${tid} started`, 'success'));
    } else {
      import('$lib/stores/toast').then((m) => m.pushToast(`Research failed`, 'error'));
    }
    starting.delete(tid);
  }
</script>

<div class="p-4">
  <h2 class="text-xl font-semibold">Research Lab</h2>
  <div class="divider"></div>
  {#if loading}
    <div>Loading…</div>
  {:else}
    <div class="grid gap-2">
      {#each techs as t}
        <div class="card p-3 flex items-center justify-between">
          <div>
            <div class="font-medium">{t.name}</div>
            <div class="text-sm text-muted">{t.description}</div>
          </div>
          <div>
            <button class="btn btn-sm" on:click={() => start(t.id)}>Start</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
