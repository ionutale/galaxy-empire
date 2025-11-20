<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  let report: any = null;
  let loading = true;

  onMount(async () => {
    const res = await fetch(`/api/reports/${$page.params.id}`);
    if (res.ok) {
      report = await res.json();
    }
    loading = false;
  });
</script>

<div class="container mx-auto p-4 max-w-4xl">
  <div class="mb-4">
    <a href="/reports" class="btn btn-ghost btn-sm">← Back to Reports</a>
  </div>

  {#if loading}
    <div class="flex justify-center"><span class="loading loading-spinner loading-lg"></span></div>
  {:else if !report}
    <div class="alert alert-error">Report not found</div>
  {:else}
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-2xl justify-center mb-6">
          {#if report.outcome === 'attacker_win'}
            <span class="text-success text-3xl">VICTORY</span>
          {:else if report.outcome === 'defender_win'}
            <span class="text-error text-3xl">DEFEAT</span>
          {:else}
            <span class="text-warning text-3xl">DRAW</span>
          {/if}
        </h2>

        <div class="grid grid-cols-2 gap-8 mb-8">
          <div class="text-center">
            <h3 class="font-bold text-xl text-primary mb-2">Attacker</h3>
            <div class="text-lg">{report.attackerId}</div>
            <div class="mt-4">
              <h4 class="font-semibold text-sm uppercase opacity-70">Losses</h4>
              <ul class="mt-2 space-y-1">
                {#each Object.entries(report.log[report.log.length-1]?.attackerLosses || {}) as [ship, count]}
                  <li class="text-error">-{count} {ship}</li>
                {:else}
                  <li class="text-success">No losses</li>
                {/each}
              </ul>
            </div>
          </div>
          <div class="text-center">
            <h3 class="font-bold text-xl text-secondary mb-2">Defender</h3>
            <div class="text-lg">{report.defenderId || 'Unknown'}</div>
            <div class="mt-4">
              <h4 class="font-semibold text-sm uppercase opacity-70">Losses</h4>
              <ul class="mt-2 space-y-1">
                {#each Object.entries(report.log[report.log.length-1]?.defenderLosses || {}) as [ship, count]}
                  <li class="text-error">-{count} {ship}</li>
                {:else}
                  <li class="text-success">No losses</li>
                {/each}
              </ul>
            </div>
          </div>
        </div>

        <div class="divider">Combat Log</div>

        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Round</th>
                <th>Attacker Fire</th>
                <th>Defender Fire</th>
                <th>Attacker Losses</th>
                <th>Defender Losses</th>
              </tr>
            </thead>
            <tbody>
              {#each report.log as round}
                <tr>
                  <td>{round.round}</td>
                  <td>{round.attackerFire}</td>
                  <td>{round.defenderFire}</td>
                  <td>
                    {#each Object.entries(round.attackerLosses) as [k, v]}
                      <div>{k}: -{v}</div>
                    {/each}
                  </td>
                  <td>
                    {#each Object.entries(round.defenderLosses) as [k, v]}
                      <div>{k}: -{v}</div>
                    {/each}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        {#if report.loot}
          <div class="divider">Loot</div>
          <div class="flex justify-center gap-4">
            <div class="badge badge-lg badge-primary">Metal: {report.loot.metal}</div>
            <div class="badge badge-lg badge-secondary">Crystal: {report.loot.crystal}</div>
            <div class="badge badge-lg badge-accent">Fuel: {report.loot.fuel}</div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
