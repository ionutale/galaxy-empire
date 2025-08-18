<script lang="ts">
  import { onMount } from 'svelte';
  let state: any = null;
  let loading = true;

  let usingDemo = false;

  async function load() {
    loading = true;
    usingDemo = false;
    try {
      let res = await fetch('/api/player/state');
      if (!res.ok) {
        // fall back to demo endpoint for unauthenticated/dev
        res = await fetch('/api/demo/player');
        usingDemo = true;
      }
      if (res.ok) {
        const body = await res.json();
        state = body.state ?? body;
      } else {
        state = null;
      }
    } catch (e) {
      state = null;
    } finally {
      loading = false;
    }
  }

  async function tickDemo(seconds = 5) {
    try {
      await fetch('/api/demo/process/tick', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ seconds }) });
      await load();
    } catch (e) {
      // ignore
    }
  }

  import { onDestroy } from 'svelte';

  function onDemoChanged() { load(); }

  onMount(() => {
    load();
    window.addEventListener('demo:changed', onDemoChanged as EventListener);
    return () => window.removeEventListener('demo:changed', onDemoChanged as EventListener);
  });

  onDestroy(() => {
    try { window.removeEventListener('demo:changed', onDemoChanged as EventListener); } catch {}
  });
</script>

<div class="flex items-center gap-2">
  {#if loading}
    <progress class="progress w-24"></progress>
  {:else if !state}
    <div class="join">
      <a href="/login" class="btn btn-ghost btn-sm join-item">Login</a>
      <a href="/register" class="btn btn-primary btn-sm join-item">Register</a>
    </div>
  {:else}
    <div class="flex items-center gap-2">
      <div class="stats stats-horizontal shadow hidden md:grid">
      <div class="stat">
        <div class="stat-title">Credits</div>
        <div class="stat-value text-primary text-xl">{state.resources?.credits ?? state.credits}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Metal</div>
        <div class="stat-value text-xl">{state.resources?.metal ?? state.metal}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Crystal</div>
        <div class="stat-value text-xl">{state.resources?.crystal ?? state.crystal}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Fuel</div>
        <div class="stat-value text-xl">{state.resources?.fuel ?? state.fuel}</div>
      </div>
      </div>
      {#if usingDemo}
        <div class="flex flex-col items-center">
          <button class="btn btn-xs btn-outline" on:click={() => tickDemo(5)}>Tick</button>
          <button class="btn btn-ghost btn-xs mt-1" on:click={() => tickDemo(60)}>+1m</button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .stat-title { opacity: .8; }
  .stat-value { font-weight: 700; }
</style>
