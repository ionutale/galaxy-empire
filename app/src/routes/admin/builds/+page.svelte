<script lang="ts">
  import { onMount } from 'svelte';
  let builds = [] as any[];
  let adminKey = '';
  let error = '';

  async function load() {
    error = '';
    const res = await fetch('/api/admin/processed-builds', { headers: { 'x-admin-key': adminKey } });
    if (res.ok) builds = (await res.json()).items || [];
    else error = 'auth_failed';
  }

  onMount(load);

  async function rollback(id: string) {
    const res = await fetch('/api/admin/processed-builds/rollback', { method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify({ id }) });
    if (res.ok) await load();
    else error = 'rollback_failed';
  }
</script>

<h2>Processed Builds (admin)</h2>
<label>Admin Key: <input bind:value={adminKey} /></label>
<button on:click={load}>Load</button>
{#if error}<p style="color:var(--error)">{error}</p>{/if}
<ul>
  {#each builds as b}
    <li>{b.id} — {b.shipTemplateId} x{b.quantity} — processed: {new Date(b.processedAt).toLocaleString()} — rolledBack: {b.rolledBack}
      {#if !b.rolledBack}
        <button on:click={() => rollback(b.id)}>Rollback</button>
      {/if}
    </li>
  {/each}
</ul>
