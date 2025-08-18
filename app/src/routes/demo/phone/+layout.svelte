<script lang="ts">
  import '../../../app.css';
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Galaxy Empire — Phone UI Demo</title>
</svelte:head>

<div class="min-h-dvh w-full bg-[#0d111c] text-gray-200 grid place-items-center overflow-hidden">
  <slot />
</div>

<style>
  :global(body){margin:0}
</style>
