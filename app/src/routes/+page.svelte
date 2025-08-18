
<script lang="ts">
	const links = [
		{ href: '/demo/paraglide', label: 'Localization' },
		{ href: '/demo/lucia', label: 'Auth (Lucia)' },
		{ href: '/fleet', label: 'Fleet' },
		{ href: '/shipyard', label: 'Shipyard' },
		{ href: '/admin/overview', label: 'Admin' }
	];
</script>

<div class="max-w-4xl mx-auto">
	<div class="hero bg-base-200 rounded-lg shadow-lg p-8">
		<div class="hero-content">
			<div>
				<h1 class="text-4xl font-bold">Galaxy Empire</h1>
				<p class="py-2 text-muted">A small demo SvelteKit game. Explore demos, play with shipbuilding and missions.</p>
				<div class="mt-4 flex flex-wrap gap-3">
					{#each links as l}
						<a class="btn btn-primary btn-md" href={l.href}>{l.label}</a>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
		<div class="card p-4">
			<h3 class="font-semibold">Quick actions</h3>
			<p class="text-sm text-muted mt-2">Create an account, start a build, or check admin missions.</p>
			<div class="mt-3 flex flex-col gap-2">
				<a class="btn btn-outline" href="/register">Create account</a>
				<a class="btn btn-outline" href="/shipyard">Start a build</a>
				<a class="btn btn-outline" href="/admin/missions">Admin: Missions</a>
			</div>
		</div>

		<div class="card p-4 col-span-2">
			<h3 class="font-semibold">News & Tips</h3>
			<div class="mt-2 text-sm text-muted">This demo ships with Drizzle ORM, Lucia auth demo and Paraglide localization. Use the demo routes to explore features.</div>
		</div>
	</div>
</div>
