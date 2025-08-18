<script lang="ts">
  import { onMount } from 'svelte';
  let templates = [] as any[];
  let queue = [] as any[];
  let error = '';

  async function load() {
    const t = await fetch('/api/shipyard/templates');
    templates = (await t.json()).templates || [];
    const q = await fetch('/api/shipyard/queue');
    if (q.ok) queue = (await q.json()).items || [];
  }

  onMount(load);

  async function build(templateId: string) {
    error = '';
    const res = await fetch('/api/shipyard/build', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ shipTemplateId: templateId, quantity: 1 })
    });
    if (res.ok) {
      await load();
    } else {
      const b = await res.json().catch(() => ({}));
      error = b?.error || 'build_failed';
    }
  }
</script>

<h2 class="text-2xl font-semibold mb-4">Shipyard</h2>
{#if error}
  <div class="alert alert-error">{error}</div>
{/if}

<section class="mb-6">
  <h3 class="text-lg font-medium">Templates</h3>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
    {#each templates as t}
      <div class="card p-4">
        <div class="flex items-start justify-between">
          <div>
            <div class="font-semibold">{t.name}</div>
            <div class="text-sm text-muted">{t.role} • {t.buildTime}s</div>
            <div class="mt-2"><span class="badge badge-outline">{t.costCredits} cr</span></div>
          </div>
          <div class="flex-shrink-0">
            <button class="btn btn-primary" on:click={() => build(t.id)}>Build</button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</section>

<section>
  <h3 class="text-lg font-medium">Queue</h3>
  {#if queue.length === 0}
    <p class="text-muted">No builds queued.</p>
  {:else}
    <div class="space-y-2 mt-3">
      {#each queue as item}
        <div class="card p-3 flex justify-between items-center">
          <div>{item.shipTemplateId} <span class="text-sm text-muted">x{item.quantity}</span></div>
          <div class="text-sm text-muted">ETA: {new Date(item.eta).toLocaleString()}</div>
        </div>
      {/each}
    </div>
  {/if}
</section>
