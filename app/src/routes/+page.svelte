
<script lang="ts">
	// lightweight home page for the Galaxy Empire demo app
	const links = [
		{ href: '/demo/paraglide', label: 'Localization demo' },
		{ href: '/demo/lucia', label: 'Auth demo (Lucia)' },
		{ href: '/fleet', label: 'Fleet' },
		{ href: '/shipyard', label: 'Shipyard' },
		{ href: '/admin/overview', label: 'Admin / Overview' },
		{ href: '/register', label: 'Register' },
		{ href: '/login', label: 'Login' }
	];
</script>

<style>
	main { max-width: 880px; margin: 48px auto; padding: 0 16px; font-family: system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial; }
	h1 { font-size: 2.25rem; margin-bottom: 0.25rem; }
	p.lead { color: #475569; margin-top: 0; }
	ul.nav { list-style: none; padding: 0; margin: 24px 0; display: grid; gap: 8px; }
	ul.nav a { display: inline-block; padding: 10px 14px; background: linear-gradient(180deg,#0ea5a9,#0284c7); color: white; border-radius: 8px; text-decoration: none; }
	ul.nav a.secondary { background: #f3f4f6; color: #0f172a; border: 1px solid #e6e9ee; }
	footer { margin-top: 36px; color: #6b7280; font-size: 0.9rem; }
</style>

<main>
	<h1>Galaxy Empire</h1>
	<p class="lead">A small demo SvelteKit game. Use the links below to explore demos and admin pages.</p>

	<nav aria-label="Primary">
		<ul class="nav">
			{#each links as l}
				<li><a href={l.href}>{l.label}</a></li>
			{/each}
		</ul>
	</nav>

	<section>
		<h2>Quick actions</h2>
		<p>Try creating an account and visiting the shipyard or starting a mission from the missions routes.</p>
		<ul class="nav">
			<li><a class="secondary" href="/register">Create account</a></li>
			<li><a class="secondary" href="/shipyard/build">Start a build</a></li>
			<li><a class="secondary" href="/admin/missions">Admin: Missions</a></li>
		</ul>
	</section>

	<footer>
		<small>Development mode — for production builds see the README in the project root.</small>
	</footer>
</main>
