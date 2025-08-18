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
  {#each items as m}
    <li>{m.id} — mission: {m.missionId} — {m.shipTemplateId} x{m.quantity} — outcome: {m.outcome} — lost: {m.quantityLost} — rewards: {m.rewardCredits}C {m.rewardMetal}M {m.rewardCrystal}X — completed: {new Date(m.completedAt).toLocaleString()} — rolledBack: {m.rolledBack}
      {#if !m.rolledBack}
        <button on:click={() => rollback(m.id)}>Rollback</button>
      {/if}
    </li>
  {/each}
</ul>
