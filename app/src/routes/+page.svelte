<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { LayoutData } from './$types';

	const session = getContext<Writable<LayoutData>>('session');
	$: user = $session?.user;
</script>

<section class="relative overflow-hidden rounded-xl bg-gradient-to-b from-base-200 to-base-100">
	<div class="hero min-h-[320px]">
		<div class="hero-content text-center">
			<div class="max-w-xl">
				<h1 class="text-5xl font-bold">Welcome to Galaxy Empire</h1>
				<p class="py-4 opacity-80">
					Build your empire, conquer the stars, and become the ruler of the galaxy.
				</p>
				<div class="flex flex-wrap gap-3 justify-center">
					{#if user}
						<a class="btn btn-primary" href="/base">Enter the Game</a>
					{:else}
						<a class="btn btn-primary" href="/login">Login to Begin</a>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>
