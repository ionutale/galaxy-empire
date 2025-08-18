<script lang="ts">
  import { onMount } from 'svelte';
  let state: any = null;
  let loading = true;

  async function load() {
    loading = true;
    try {
      const res = await fetch('/api/player/state');
      if (res.ok) {
        const body = await res.json();
        state = body.state;
      } else {
        state = null;
      }
    } catch (e) {
      state = null;
    } finally {
      loading = false;
    }
  }

  onMount(load);
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
  {/if}
</div>

<style>
  .stat-title { opacity: .8; }
  .stat-value { font-weight: 700; }
</style>
