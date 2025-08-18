<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="Galaxy Empire — a small SvelteKit demo game" />
</svelte:head>

<!-- daisyUI theme wrapper; change theme name if you prefer -->
<div data-theme="emerald" class="min-h-screen flex flex-col bg-base-100 text-base-content">
	<header class="w-full">
		<nav class="navbar container mx-auto px-4 py-3">
			<div class="flex-1">
				<a href="/" class="btn btn-ghost normal-case text-xl">Galaxy Empire</a>
			</div>
			<div class="flex-none gap-2">
				<a class="btn btn-ghost hidden sm:inline" href="/fleet">Fleet</a>
				<a class="btn btn-ghost hidden sm:inline" href="/shipyard">Shipyard</a>
				<a class="btn btn-ghost hidden md:inline" href="/admin/overview">Admin</a>
				<a class="btn btn-primary ml-2" href="/demo/paraglide">Demos</a>
			</div>
		</nav>
	</header>

	<main class="flex-1 container mx-auto px-4 py-8">
		<slot />
	</main>

	<footer class="footer footer-center p-6 bg-base-200">
		<div>
			<p>© {new Date().getFullYear()} Galaxy Empire — development build</p>
			<p class="text-sm text-muted">Built with SvelteKit · DaisyUI · Drizzle</p>
		</div>
	</footer>
</div>
