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
    <div class="hidden md:flex items-center gap-2">
      <div class="rounded-full bg-white/5 backdrop-blur border border-white/10 px-3 py-1 text-xs flex items-center gap-3">
        <span class="opacity-70">Cr</span><span class="font-semibold">{state.resources?.credits ?? state.credits}</span>
        <span class="opacity-30">•</span>
        <span class="opacity-70">Me</span><span class="font-semibold">{state.resources?.metal ?? state.metal}</span>
        <span class="opacity-30">•</span>
        <span class="opacity-70">Xt</span><span class="font-semibold">{state.resources?.crystal ?? state.crystal}</span>
        <span class="opacity-30">•</span>
        <span class="opacity-70">Fu</span><span class="font-semibold">{state.resources?.fuel ?? state.fuel}</span>
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
