<script lang="ts">
  import { onMount } from 'svelte';
  let templates = [] as any[];
  let queue = [] as any[];
  let error = '';
  let loading = true;
  let qty: Record<string, number> = {};

  async function load() {
    loading = true;
    const t = await fetch('/api/shipyard/templates');
    templates = (await t.json()).templates || [];
    for (const tp of templates) qty[tp.id] = qty[tp.id] ?? 1;
    const q = await fetch('/api/shipyard/queue');
    if (q.ok) queue = (await q.json()).items || [];
    loading = false;
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
      await load();
    } else {
      const b = await res.json().catch(() => ({}));
      error = b?.error || 'build_failed';
    }
  }

  function etaProgress(eta: string | number | Date, startedAt?: string | number | Date) {
    const end = new Date(eta).getTime();
    const now = Date.now();
    const started = startedAt ? new Date(startedAt).getTime() : end - 1000 * 60 * 60; // fallback 1h window
    const pct = Math.max(0, Math.min(100, ((now - started) / (end - started)) * 100));
    return Number.isFinite(pct) ? Math.round(pct) : 0;
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
  <div role="tablist" class="tabs tabs-lifted">
    <input type="radio" name="shipyard_tabs" role="tab" class="tab" aria-label="Templates" checked />
    <div role="tabpanel" class="tab-content bg-base-200 border-base-300 rounded-box p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each templates as t}
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="card-title">{t.name}</h3>
                  <p class="text-sm opacity-70">{t.role} • {t.buildTime}s</p>
                </div>
                <div class="text-right">
                  <span class="badge badge-outline">{t.costCredits} cr</span>
                </div>
              </div>

              <div class="mt-3 flex items-center justify-between">
                {#key t.id}
                  {@const inputId = `qty-${t.id}`}
                  <label class="label" for={inputId}><span class="label-text">Qty</span></label>
                  <div class="join">
                    <button class="btn btn-sm join-item" on:click={() => qty[t.id] = Math.max(1, (qty[t.id] ?? 1) - 1)}>-</button>
                    <input id={inputId} class="input input-sm input-bordered w-16 text-center join-item" bind:value={qty[t.id]} inputmode="numeric" />
                    <button class="btn btn-sm join-item" on:click={() => qty[t.id] = Math.min(99, (qty[t.id] ?? 1) + 1)}>+</button>
                  </div>
                {/key}
              </div>

              <div class="card-actions justify-end mt-2">
                <button class="btn btn-primary" on:click={() => build(t.id)}>Queue build</button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <input type="radio" name="shipyard_tabs" role="tab" class="tab" aria-label="Queue" />
    <div role="tabpanel" class="tab-content bg-base-200 border-base-300 rounded-box p-4">
      {#if queue.length === 0}
        <div class="alert">
          <span>No builds queued.</span>
        </div>
      {:else}
        <div class="space-y-3">
          {#each queue as item}
            <div class="card bg-base-100 shadow">
              <div class="card-body">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">{item.shipTemplateId} <span class="text-sm opacity-70">x{item.quantity}</span></div>
                    <div class="text-sm opacity-70">ETA: {new Date(item.eta).toLocaleString()}</div>
                  </div>
                  <div class="w-48">
                    <progress class="progress progress-primary w-full" value={etaProgress(item.eta, item.startedAt)} max="100"></progress>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
