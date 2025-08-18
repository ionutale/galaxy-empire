<script lang="ts">
  import { onMount } from 'svelte';
  let builds = [] as any[];
  let missions = [] as any[];
  let adminKey = '';
  let error = '';

  async function load() {
    error = '';
    const rb = await fetch('/api/admin/processed-builds', { headers: { 'x-admin-key': adminKey } });
    if (rb.ok) builds = (await rb.json()).items || [];
    else error = 'auth_failed_builds';
    const rm = await fetch('/api/admin/processed-missions', { headers: { 'x-admin-key': adminKey } });
    if (rm.ok) missions = (await rm.json()).items || [];
    else error = 'auth_failed_missions';
  }

  onMount(load);

  async function rollbackBuild(id: string) {
    const res = await fetch('/api/admin/processed-builds/rollback', { method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify({ id }) });
    if (res.ok) await load();
    else error = 'rollback_failed_build';
  }

  async function rollbackMission(id: string) {
    const res = await fetch('/api/admin/processed-missions/rollback', { method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify({ id }) });
    if (res.ok) await load();
    else error = 'rollback_failed_mission';
  }
</script>

<h2>Admin Overview</h2>
<label>Admin Key: <input bind:value={adminKey} /></label>
<button on:click={load}>Load</button>
<h3>Processed Builds</h3>
<ul>
  {#each builds as b}
    <li>{b.id} — {b.shipTemplateId} x{b.quantity} — processed: {new Date(b.processedAt).toLocaleString()} — rolledBack: {b.rolledBack}
      {#if !b.rolledBack}
        <button on:click={() => rollbackBuild(b.id)}>Rollback</button>
      {/if}
    </li>
  {/each}
</ul>

<div class="max-w-4xl mx-auto space-y-4">
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
                  <button class="btn btn-sm btn-warning" on:click={() => { if (confirm('Rollback build?')) rollbackBuild(b.id); }}>Rollback</button>
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
                  <button class="btn btn-sm btn-warning" on:click={() => { if (confirm('Rollback mission?')) rollbackMission(m.id); }}>Rollback</button>
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

<h3>Processed Missions</h3>
<ul>
  {#each missions as m}
    <li>{m.id} — mission: {m.missionId} — {m.shipTemplateId} x{m.quantity} — outcome: {m.outcome} — lost: {m.quantityLost} — rewards: {m.rewardCredits}C {m.rewardMetal}M {m.rewardCrystal}X — completed: {new Date(m.completedAt).toLocaleString()} — rolledBack: {m.rolledBack}
      {#if !m.rolledBack}
        <button on:click={() => rollbackMission(m.id)}>Rollback</button>
      {/if}
    </li>
  {/each}
</ul>
