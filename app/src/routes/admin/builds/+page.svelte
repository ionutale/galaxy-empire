<script lang="ts">
import { onMount } from 'svelte';
let builds: unknown[] = [];
let adminKey = '';
let error = '';
let loading = false;
let lastLoaded: Date | null = null;

async function load() {
  loading = true;
  error = '';
  try {
    const res = await fetch('/api/admin/processed-builds', { headers: { 'x-admin-key': adminKey } });
    if (res.ok) builds = (await res.json()).items || [];
    else { builds = []; error = 'auth_failed'; }
    lastLoaded = new Date();
  } catch (e) {
    error = 'network_error';
  } finally {
    loading = false;
  }
}

onMount(load);

async function rollback(id: string) {
  try {
    const res = await fetch('/api/admin/processed-builds/rollback', { method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify({ id }) });
    if (res.ok) await load();
    else error = 'rollback_failed';
  } catch (e) {
    error = 'network_error';
  }
}
</script>

<div class="max-w-4xl mx-auto space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold">Processed Builds</h2>
      <p class="text-sm text-muted">Roll back builds processed by the worker.</p>
    </div>
    <div class="text-right text-sm text-muted">
      {#if lastLoaded}
        <div>Last loaded: {lastLoaded.toLocaleString()}</div>
      {/if}
      <div>{loading ? 'Loading…' : ''}</div>
    </div>
  </div>

  <div class="card p-4">
    <div class="form-control">
      <label class="label" for="admin-key-builds"><span class="label-text">Admin Key</span></label>
      <div class="flex gap-2">
        <input id="admin-key-builds" class="input input-bordered flex-1" bind:value={adminKey} placeholder="paste admin key" />
        <button class="btn btn-primary" on:click={load} disabled={loading}>{loading ? 'Loading…' : 'Load'}</button>
      </div>
    </div>
    {#if error}
      <div class="mt-3 alert alert-error">{error}</div>
    {/if}
  </div>

  <section class="card p-4">
    <div class="flex items-center justify-between">
      <h3 class="font-semibold">Entries</h3>
      <div class="text-sm text-muted">{builds.length} items</div>
    </div>
  <div class="divider"></div>
    {#if builds.length === 0}
      <p class="text-muted">No processed builds</p>
    {:else}
      <div class="space-y-2">
        {#each builds as b}
          <div class="flex items-center justify-between p-2 border rounded">
            <div>
              <div class="font-medium">{b.shipTemplateId} x{b.quantity}</div>
              <div class="text-sm text-muted">Processed: {new Date(b.processedAt).toLocaleString()}</div>
            </div>
            <div>
              {#if !b.rolledBack}
                <button class="btn btn-sm btn-warning" on:click={() => { if (confirm('Rollback build?')) rollback(b.id); }} disabled={loading}>Rollback</button>
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
