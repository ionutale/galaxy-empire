<script lang="ts">
  import { onMount } from 'svelte';
  let templates = [] as any[];
  let queue = [] as any[];
  let error = '';

  async function load() {
    const t = await fetch('/api/shipyard/templates');
    templates = (await t.json()).templates || [];
    const q = await fetch('/api/shipyard/queue');
    if (q.ok) queue = (await q.json()).items || [];
  }

  onMount(load);

  async function build(templateId: string) {
    error = '';
    const res = await fetch('/api/shipyard/build', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ shipTemplateId: templateId, quantity: 1 })
    });
    if (res.ok) {
      await load();
    } else {
      const b = await res.json().catch(() => ({}));
      error = b?.error || 'build_failed';
    }
  }
</script>

<h2>Shipyard</h2>
{#if error}
<p style="color:var(--error)">{error}</p>
{/if}
<h3>Templates</h3>
<ul>
  {#each templates as t}
    <li>
      <strong>{t.name}</strong> — {t.role} — {t.costCredits} credits — build {t.buildTime}s
      <button on:click={() => build(t.id)}>Build x1</button>
    </li>
  {/each}
</ul>

<h3>Queue</h3>
{#if queue.length === 0}
<p>No builds queued.</p>
{:else}
<ul>
  {#each queue as item}
    <li>{item.shipTemplateId} x{item.quantity} — ETA: {new Date(item.eta).toLocaleString()}</li>
  {/each}
</ul>
{/if}
