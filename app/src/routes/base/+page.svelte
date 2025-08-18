<script lang="ts">
  import { onMount } from 'svelte';
  let state: any = null;
  let error = '';

  onMount(async () => {
    const res = await fetch('/api/player/state');
    if (res.ok) {
      const body = await res.json();
      state = body.state;
    } else {
      error = 'unauthenticated';
    }
  });

  async function processBuilds() {
    const res = await fetch('/api/shipyard/process', { method: 'POST' });
    if (res.ok) {
      const b = await res.json();
      await new Promise((r) => setTimeout(r, 200));
      const r2 = await fetch('/api/player/state');
      state = (await r2.json()).state;
    } else {
      error = 'process_failed';
    }
  }
</script>

{#if error}
<p>{error} — <a href="/login">login</a> or <a href="/register">register</a></p>
{:else if !state}
<p>Loading...</p>
{:else}
<h2>Base — {state.username}</h2>
<div>
  <p>Level: {state.level} | Power: {state.power}</p>
  <h3>Resources</h3>
  <ul>
    <li>Credits: {state.resources.credits}</li>
    <li>Metal: {state.resources.metal}</li>
    <li>Crystal: {state.resources.crystal}</li>
    <li>Fuel: {state.resources.fuel}</li>
  </ul>
</div>
<div>
  <h3>Ships</h3>
  {#if state.ships && state.ships.length > 0}
    <ul>
      {#each state.ships as s}
        <li>{s.shipTemplateId} x{s.quantity}</li>
      {/each}
    </ul>
  {:else}
    <p>No ships yet.</p>
  {/if}
  <button on:click={processBuilds}>Process builds (dev)</button>
</div>
{/if}
