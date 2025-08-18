<script lang="ts">
  import { onMount } from 'svelte';
  let state: any = null;
  let missions: any[] = [];
  let error = '';

  async function load() {
    const res = await fetch('/api/player/state');
    if (res.ok) state = (await res.json()).state;
    const m = await fetch('/api/missions');
    if (m.ok) missions = (await m.json()).missions || [];
  }

  onMount(load);

  async function launch(shipTemplateId: string) {
    const res = await fetch('/api/missions/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ shipTemplateId, quantity: 1 }) });
    if (res.ok) await load();
    else error = 'launch_failed';
  }
</script>

<h2>Fleet</h2>
{#if !state}
<p>Loading...</p>
{:else}
<h3>Your Ships</h3>
{#if state.ships && state.ships.length > 0}
<ul>
  {#each state.ships as s}
    <li>{s.shipTemplateId} x{s.quantity} <button on:click={() => launch(s.shipTemplateId)}>Launch mission</button></li>
  {/each}
</ul>
{:else}
<p>No ships</p>
{/if}

<h3>Missions</h3>
{#if missions.length === 0}<p>No missions</p>{:else}
<ul>
  {#each missions as m}
    <li>{m.id} — {m.shipTemplateId} x{m.quantity} — {m.status} — ETA: {new Date(m.eta).toLocaleString()}</li>
  {/each}
</ul>
{/if}
{/if}
