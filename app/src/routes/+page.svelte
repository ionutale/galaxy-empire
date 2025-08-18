<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { LayoutData } from './$types';

	const session = getContext<Writable<LayoutData>>('session');
	$: user = $session?.user;

	const primaryLinks = [
		{ href: '/fleet', label: 'Fleet' },
		{ href: '/shipyard', label: 'Shipyard' },
		{ href: '/base', label: 'Base' },
	];
	const adminLinks = [
		{ href: '/admin/overview', label: 'Admin' }
	];
</script>

<section class="relative overflow-hidden rounded-xl bg-gradient-to-b from-base-200 to-base-100">
	<div class="hero min-h-[320px]">
		<div class="hero-content flex-col lg:flex-row">
			<div class="max-w-xl">
				<h1 class="text-5xl font-bold">Galaxy Empire</h1>
				<p class="py-4 opacity-80">Build ships, command fleets, and conquer the stars — a SvelteKit mini game powered by Drizzle.</p>
				<div class="flex flex-wrap gap-3">
					{#if user}
						{#each primaryLinks as l}
							<a class="btn btn-primary" href={l.href}>{l.label}</a>
						{/each}
					{:else}
						<a class="btn btn-outline" href="/register">Get started</a>
					{/if}
				</div>
			</div>
			<div class="mt-6 lg:mt-0">
				<div class="mockup-window border border-base-300 bg-base-200 w-[320px]">
					<div class="p-6">
						<p class="opacity-70">Real-time queue processing with a background worker. Build ships and send missions.</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

{#if !user}
<section class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">

	<div class="card bg-base-200 shadow">
		<div class="card-body">
			<h3 class="card-title">Quick actions</h3>
			<p class="opacity-80">Create an account, start a build, or check admin missions.</p>
			<div class="card-actions mt-2">
				<a class="btn" href="/register">Create account</a>
				<a class="btn" href="/shipyard">Start a build</a>
				<a class="btn" href="/admin/missions">Admin: Missions</a>
			</div>
		</div>
	</div>

	<div class="card bg-base-200 shadow">
		<div class="card-body">
			<h3 class="card-title">Admin</h3>
			<div class="flex flex-wrap gap-2">
				{#each adminLinks as l}
					<a class="badge badge-lg" href={l.href}>{l.label}</a>
				{/each}
			</div>
			<p class="opacity-80">Operations dashboard for processed builds and missions.</p>
		</div>
	</div>
</section>
{/if}
