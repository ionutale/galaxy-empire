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
{#if error}<p style="color:var(--error)">{error}</p>{/if}

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
