<script lang="ts">
  import { onMount } from 'svelte';
  import { getContext } from 'svelte';
  import type { Writable } from 'svelte/store';
  import type { LayoutData } from '../../routes/$types';
  const session = getContext<Writable<LayoutData>>('session');
  $: user = $session?.user;
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
  import { SHIP_TEMPLATES } from '$lib/data/gameData';

  // compute production per-second from buildings
  // explicit mapping of building id -> resource key for production
  const BUILDING_PRODUCTION_RESOURCE: Record<string, 'metal' | 'crystal' | 'fuel' | 'credits'> = {
    metalMine: 'metal',
    crystalSynthesizer: 'crystal',
    deuteriumRefinery: 'fuel',
    // other mines can be added here; defaults will go to credits
  };

  function computeProductionPerSecond(s: any) {
    let metal = 0, crystal = 0, fuel = 0, credits = 0;
    // buildings
    for (const [bid, def] of Object.entries(BUILDING_DATA)) {
      const lvl = s?.buildings?.[bid] ?? 0;
      if (def.production && typeof def.production === 'function') {
        const perHour = def.production(lvl) || 0;
        const perSec = perHour / 3600;
        const target = BUILDING_PRODUCTION_RESOURCE[bid];
        if (target === 'metal') metal += perSec;
        else if (target === 'crystal') crystal += perSec;
        else if (target === 'fuel') fuel += perSec;
        else credits += perSec;
      }
    }

    // ships: mining vessels produce metal (assumption: miningRate is per hour)
      if (s?.ships) {
        // ships may be an array of objects or an object map { shipId: qty }
        if (Array.isArray(s.ships)) {
          for (const shp of s.ships) {
            if (!shp) continue;
            const qty = shp.quantity ?? 0;
            const templateId = shp.shipTemplateId ?? shp.shipId ?? shp.id;
            const t = SHIP_TEMPLATES.find((x: any) => x.shipId === templateId);
            if (t && (t as any).miningRate) {
              const perHour = (t as any).miningRate * qty;
              metal += perHour / 3600;
            }
          }
        } else if (typeof s.ships === 'object') {
          for (const [templateId, qtyRaw] of Object.entries(s.ships)) {
            const qty = Number(qtyRaw) || 0;
            const t = SHIP_TEMPLATES.find((x: any) => x.shipId === templateId || x.shipId === String(templateId));
            if (t && (t as any).miningRate) {
              const perHour = (t as any).miningRate * qty;
              metal += perHour / 3600;
            }
          }
        }
      }

    return { metal, crystal, fuel, credits };
  }

  // reactive production snapshot used in template
  let prod: { metal: number; crystal: number; fuel: number; credits: number } = { metal: 0, crystal: 0, fuel: 0, credits: 0 };
  $: prod = computeProductionPerSecond(state);

  function onDemoChanged() { load(); }

  function onPlayerChanged() { load(); }

  onMount(() => {
    load();
  window.addEventListener('demo:changed', onDemoChanged as EventListener);
  window.addEventListener('player:changed', onPlayerChanged as EventListener);
    // attempt to start demo worker once
    startDemoWorker();
    // poll every 5s for updated demo resources when demo is active
  poll = setInterval(() => { load(); }, 5000);
    return () => {
  window.removeEventListener('demo:changed', onDemoChanged as EventListener);
  window.removeEventListener('player:changed', onPlayerChanged as EventListener);
      if (poll) {
        clearInterval(poll);
        poll = null;
      }
    };
  });
  
  onDestroy(() => {
  try { window.removeEventListener('demo:changed', onDemoChanged as EventListener); } catch {}
  try { window.removeEventListener('player:changed', onPlayerChanged as EventListener); } catch {}
    if (poll) {
      clearInterval(poll);
      poll = null;
    }
  });
</script>

{#if user}
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
{/if}

<style>
  :global(.link){ text-decoration: underline; }
</style>
