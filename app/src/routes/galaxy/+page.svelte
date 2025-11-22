<script lang="ts">
  import { onMount } from 'svelte';
  import GalaxyMap from '$lib/components/GalaxyMap.svelte';

  let systems: any[] = [];
  let loading = true;

  let userHomeSystem: number | null = null;
  let userId: string | null = null;

  onMount(async () => {
    const [galaxyRes, playerRes] = await Promise.all([
      fetch('/api/galaxy'),
      fetch('/api/player/state')
    ]);

    if (galaxyRes.ok) {
      systems = await galaxyRes.json();
    }

    if (playerRes.ok) {
      const playerData = await playerRes.json();
      userHomeSystem = playerData.state.homeSystem;
      userId = playerData.state.playerId;
    }
    
    loading = false;
  });
</script>

<div class="container mx-auto p-4 h-[calc(100vh-4rem)] flex flex-col">
  <h1 class="text-3xl font-bold mb-4 text-primary">Galaxy Map</h1>
  
  {#if loading}
    <div class="flex-1 flex items-center justify-center">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else}
    <div class="flex-1 bg-base-300 rounded-lg shadow-inner overflow-hidden">
      <GalaxyMap {systems} {userHomeSystem} userId={userId} />
    </div>
  {/if}
</div>
