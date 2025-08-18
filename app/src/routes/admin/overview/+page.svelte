<script lang="ts">
import { onMount } from 'svelte';
let builds = [] as any[];
let missions = [] as any[];
let adminKey = '';
let error = '';
let loading = false;
let lastLoaded: Date | null = null;

async function load() {
  loading = true;
  error = '';
  try {
    const [rb, rm] = await Promise.all([
      fetch('/api/admin/processed-builds', { headers: { 'x-admin-key': adminKey } }),
      fetch('/api/admin/processed-missions', { headers: { 'x-admin-key': adminKey } })
    ]);

    if (rb.ok) {
      builds = (await rb.json()).items || [];
    } else {
      builds = [];
      error = 'auth_failed_builds';
    }

    if (rm.ok) {
      missions = (await rm.json()).items || [];
    } else {
      missions = [];
      error = error || 'auth_failed_missions';
    }

    lastLoaded = new Date();
  } catch (e) {
    error = 'network_error';
  } finally {
    loading = false;
  }
}

onMount(load);

async function rollbackBuild(id: string) {
  try {
    const res = await fetch('/api/admin/processed-builds/rollback', { method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify({ id }) });
    if (res.ok) await load();
    else error = 'rollback_failed_build';
  } catch (e) {
    error = 'network_error';
  }
}

async function rollbackMission(id: string) {
  try {
    const res = await fetch('/api/admin/processed-missions/rollback', { method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify({ id }) });
    if (res.ok) await load();
    else error = 'rollback_failed_mission';
  } catch (e) {
    error = 'network_error';
  }
}
</script>

<div class="max-w-5xl mx-auto space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold">Admin Overview</h2>
      <p class="text-sm text-muted">Inspect processed builds and missions, and rollback if needed.</p>
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
      <label class="label"><span class="label-text">Admin Key</span></label>
      <div class="flex gap-2">
        <input class="input input-bordered flex-1" bind:value={adminKey} placeholder="paste admin key" />
        <button class="btn btn-primary" on:click={load} disabled={loading}>{loading ? 'Loading…' : 'Load'}</button>
      </div>
    </div>
    {#if error}
      <div class="mt-3 alert alert-error">{error}</div>
    {/if}
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="card p-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-muted">Processed builds</div>
          <div class="text-2xl font-semibold">{builds.length}</div>
        </div>
        <div class="text-right">
          <button class="btn btn-xs btn-outline" on:click={load} disabled={loading}>Refresh</button>
        </div>
      </div>
    </div>

    <div class="card p-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-muted">Processed missions</div>
          <div class="text-2xl font-semibold">{missions.length}</div>
        </div>
        <div class="text-right">
          <button class="btn btn-xs btn-outline" on:click={load} disabled={loading}>Refresh</button>
        </div>
      </div>
    </div>

    <div class="card p-4">
      <div class="text-sm text-muted">Status</div>
      <div class="mt-2">
        {#if loading}
          <span class="badge badge-info">Loading</span>
        {:else}
          <span class="badge badge-success">Idle</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <section class="card p-4">
      <h3 class="font-semibold">Processed Builds</h3>
      <div class="divider" />
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
              <div class="flex items-center gap-2">
                {#if !b.rolledBack}
                  <button class="btn btn-sm btn-warning" on:click={() => { if (confirm('Rollback build?')) rollbackBuild(b.id); }} disabled={loading} aria-disabled={loading} title="Rollback build">Rollback</button>
                {:else}
                  <span class="badge">Rolled back</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <section class="card p-4">
      <h3 class="font-semibold">Processed Missions</h3>
      <div class="divider" />
      {#if missions.length === 0}
        <p class="text-muted">No processed missions</p>
      {:else}
        <div class="space-y-2">
          {#each missions as m}
            <div class="flex items-center justify-between p-2 border rounded">
              <div>
                <div class="font-medium">{m.shipTemplateId} x{m.quantity} — {m.outcome}</div>
                <div class="text-sm text-muted">Completed: {new Date(m.completedAt).toLocaleString()}</div>
              </div>
              <div class="flex items-center gap-2">
                {#if !m.rolledBack}
                  <button class="btn btn-sm btn-warning" on:click={() => { if (confirm('Rollback mission?')) rollbackMission(m.id); }} disabled={loading} aria-disabled={loading} title="Rollback mission">Rollback</button>
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

</div>
