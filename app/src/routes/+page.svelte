<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { LayoutData } from './$types';

	const session = getContext<Writable<LayoutData>>('session');
	$: user = $session?.user;
</script>

<section class="relative overflow-hidden min-h-[80vh] flex items-center justify-center">
	<div class="hero">
		<div class="hero-content text-center">
			<div class="max-w-2xl">
				<h1 class="text-6xl md:text-8xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple drop-shadow-[0_0_20px_rgba(0,243,255,0.3)] mb-6">Galaxy Empire</h1>
				<p class="py-6 text-xl md:text-2xl text-slate-300 font-light tracking-wide">
					Build your empire, conquer the stars, and become the ruler of the galaxy.
				</p>
				<div class="flex flex-wrap justify-center gap-6 mt-8">
					{#if user}
						<a class="btn btn-lg bg-neon-blue text-black border-neon-blue hover:bg-neon-blue/80 hover:border-neon-blue font-bold tracking-wide shadow-[0_0_20px_rgba(0,243,255,0.4)] px-8" href="/base">Enter the Game</a>
					{:else}
						<a class="btn btn-lg bg-neon-blue text-black border-neon-blue hover:bg-neon-blue/80 hover:border-neon-blue font-bold tracking-wide shadow-[0_0_20px_rgba(0,243,255,0.4)] px-8" href="/auth/login">Login to Begin</a>
						<a class="btn btn-lg btn-outline text-neon-purple border-neon-purple hover:bg-neon-purple hover:text-black hover:border-neon-purple font-bold tracking-wide shadow-[0_0_15px_rgba(168,85,247,0.2)] px-8" href="/register">Register</a>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>
