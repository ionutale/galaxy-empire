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
{/if}
