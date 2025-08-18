<script lang="ts">
  import { onMount } from 'svelte';
  let items = [] as any[];
  let adminKey = '';
  let error = '';

  async function load() {
    error = '';
    const res = await fetch('/api/admin/processed-missions', { headers: { 'x-admin-key': adminKey } });
    if (res.ok) items = (await res.json()).items || [];
    else error = 'auth_failed';
  }

  onMount(load);

  async function rollback(id: string) {
    const res = await fetch('/api/admin/processed-missions/rollback', { method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify({ id }) });
    if (res.ok) await load();
    else error = 'rollback_failed';
  }
</script>

<h2>Processed Missions (admin)</h2>
<label>Admin Key: <input bind:value={adminKey} /></label>
<button on:click={load}>Load</button>
{#if error}<p style="color:var(--error)">{error}</p>{/if}
<ul>
<div class="max-w-3xl mx-auto space-y-4">
  <div class="card p-4">
    <div class="form-control">
      <label class="label"><span class="label-text">Admin Key</span></label>
      <div class="flex gap-2">
        <input class="input input-bordered flex-1" bind:value={adminKey} />
        <button class="btn btn-primary" on:click={load}>Load</button>
      </div>
    </div>
    {#if error}
      <div class="mt-3 alert alert-error">{error}</div>
    {/if}
  </div>

  <section class="card p-4">
    <h3 class="font-semibold">Processed Missions</h3>
    <div class="divider" />
    {#if items.length === 0}
      <p class="text-muted">No processed missions</p>
    {:else}
      <div class="space-y-2">
        {#each items as m}
          <div class="flex items-center justify-between p-2 border rounded">
            <div>
              <div class="font-medium">{m.shipTemplateId} x{m.quantity} — {m.outcome}</div>
              <div class="text-sm text-muted">Completed: {new Date(m.completedAt).toLocaleString()}</div>
            </div>
            <div>
              {#if !m.rolledBack}
                <button class="btn btn-sm btn-warning" on:click={() => { if (confirm('Rollback mission?')) rollback(m.id); }}>Rollback</button>
              {:else}
                <span class="badge">Rolled back</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
