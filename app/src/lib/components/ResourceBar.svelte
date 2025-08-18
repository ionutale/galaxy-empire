<script lang="ts">
  import { onMount } from 'svelte';
  let state: any = null;
  let loading = true;

  let usingDemo = false;
  let poll: ReturnType<typeof setInterval> | null = null;

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

  // start a continuous demo worker when using demo mode
  async function startDemoWorker() {
    try {
      await fetch('/api/demo/process/worker', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'start', seconds: 5 }) });
    } catch (e) {
      // ignore
    }
  }

  import { onDestroy } from 'svelte';
  import { BUILDING_DATA } from '$lib/data/gameData';

  // compute production per-second from buildings
  function computeProductionPerSecond(s: any) {
    if (!s || !s.buildings) return { metal: 0, crystal: 0, fuel: 0, credits: 0 };
    let metal = 0, crystal = 0, fuel = 0, credits = 0;
    for (const [bid, def] of Object.entries(BUILDING_DATA)) {
      const lvl = s.buildings?.[bid] ?? 0;
      if (def.production && typeof def.production === 'function') {
        const perHour = def.production(lvl);
        const perSec = perHour / 3600;
        // heuristically map production to resource types by building id
        if (bid.toLowerCase().includes('metal')) metal += perSec;
        else if (bid.toLowerCase().includes('crystal')) crystal += perSec;
        else if (bid.toLowerCase().includes('deuterium') || bid.toLowerCase().includes('fuel') || bid.toLowerCase().includes('refinery')) fuel += perSec;
        else credits += perSec; // fallback
      }
    }
    // mining ships and other ship-based mining could be added here
    return { metal, crystal, fuel, credits };
  }

  function onDemoChanged() { load(); }

  onMount(() => {
    load();
    window.addEventListener('demo:changed', onDemoChanged as EventListener);
    // attempt to start demo worker once
    startDemoWorker();
    // poll every 5s for updated demo resources when demo is active
  poll = setInterval(() => { if (usingDemo) load(); }, 5000);
    return () => {
      window.removeEventListener('demo:changed', onDemoChanged as EventListener);
      if (poll) {
        clearInterval(poll);
        poll = null;
      }
    };
  });
  
  onDestroy(() => {
    try { window.removeEventListener('demo:changed', onDemoChanged as EventListener); } catch {}
    if (poll) {
      clearInterval(poll);
      poll = null;
    }
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
    <div class="hidden md:flex items-center gap-2">
      <div class="rounded-full bg-white/5 backdrop-blur border border-white/10 px-3 py-1 text-xs flex items-center gap-3">
        {#let prod = computeProductionPerSecond(state)}
          <span class="opacity-70">Cr</span><span class="font-semibold">{state.resources?.credits ?? state.credits}</span>
          <span class="text-xs text-success">+{Math.round(prod.credits * 3600)}/h</span>
          <span class="opacity-30">•</span>
          <span class="opacity-70">Me</span><span class="font-semibold">{state.resources?.metal ?? state.metal}</span>
          <span class="text-xs text-success">+{Math.round(prod.metal * 3600)}/h</span>
          <span class="opacity-30">•</span>
          <span class="opacity-70">Xt</span><span class="font-semibold">{state.resources?.crystal ?? state.crystal}</span>
          <span class="text-xs text-success">+{Math.round(prod.crystal * 3600)}/h</span>
          <span class="opacity-30">•</span>
          <span class="opacity-70">Fu</span><span class="font-semibold">{state.resources?.fuel ?? state.fuel}</span>
          <span class="text-xs text-success">+{Math.round(prod.fuel * 3600)}/h</span>
        {/let}
      </div>
      {#if usingDemo}
        <div class="flex items-center gap-1">
          <button class="btn btn-xs btn-outline" on:click={() => tickDemo(5)}>+5s</button>
          <button class="btn btn-xs btn-ghost" on:click={() => tickDemo(60)}>+1m</button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  :global(.link){ text-decoration: underline; }
</style>
