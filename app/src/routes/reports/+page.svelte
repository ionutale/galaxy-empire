<script lang="ts">
  import { onMount } from 'svelte';
  
  let reports: any[] = [];
  let loading = true;

  onMount(async () => {
    const res = await fetch('/api/reports');
    if (res.ok) {
      reports = await res.json();
    }
    loading = false;
  });
</script>

<div class="container mx-auto p-4">
  <h1 class="text-3xl font-bold mb-6 text-primary">Combat Reports</h1>

  {#if loading}
    <div class="flex justify-center"><span class="loading loading-spinner loading-lg"></span></div>
  {:else if reports.length === 0}
    <div class="alert alert-info">No combat reports found.</div>
  {:else}
    <div class="space-y-4">
      {#each reports as report}
        <a href="/reports/{report.id}" class="block card bg-base-200 hover:bg-base-300 transition-colors shadow-md">
          <div class="card-body flex flex-row items-center justify-between p-4">
            <div>
              <div class="font-bold text-lg flex items-center gap-2">
                {#if report.outcome === 'attacker_win'}
                  <span class="text-success">Victory</span>
                {:else if report.outcome === 'defender_win'}
                  <span class="text-error">Defeat</span>
                {:else}
                  <span class="text-warning">Draw</span>
                {/if}
                <span class="text-xs text-muted font-normal">vs {report.defenderId || 'Unknown'}</span>
              </div>
              <div class="text-sm opacity-70">{new Date(report.timestamp).toLocaleString()}</div>
            </div>
            <div class="text-right">
              <div class="text-sm">Loot: 
                {#if report.loot}
                  <span class="badge badge-sm badge-outline">M: {report.loot.metal || 0}</span>
                  <span class="badge badge-sm badge-outline">C: {report.loot.crystal || 0}</span>
                {:else}
                  None
                {/if}
              </div>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
