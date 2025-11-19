<script lang="ts">
  import toasts, { removeToast } from '$lib/stores/toast';
  import { fly } from 'svelte/transition';
</script>

<div class="fixed right-4 top-4 z-[9999] space-y-2">
  {#each $toasts as t (t.id)}
    <div in:fly={{ y: -10 }} out:fly={{ y: -10 }} class="p-3 rounded shadow-md max-w-xs text-sm" class:bg-green-600={t.type==='success'} class:bg-red-600={t.type==='error'} class:bg-slate-700={t.type==='info'}>
      <div class="flex items-center justify-between gap-2">
        <div class="truncate">{t.message}</div>
        <button class="btn btn-xs btn-ghost" on:click={() => removeToast(t.id)}>×</button>
      </div>
    </div>
  {/each}
</div>
