<script lang="ts">
	import '../../../app.css';
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>Galaxy Empire — Phone UI Demo</title>
</svelte:head>

<div class="grid min-h-dvh w-full place-items-center overflow-hidden bg-[#0d111c] text-gray-200">
	<slot />
</div>

<style>
	:global(body) {
		margin: 0;
	}
</style>
