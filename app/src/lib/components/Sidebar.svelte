<script lang="ts">
	import { page } from '$app/stores';
	import { createEventDispatcher, getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { LayoutData } from '../../routes/$types';
	import { goto } from '$app/navigation';

	const dispatch = createEventDispatcher<{ navigate: void }>();
	const session = getContext<Writable<LayoutData>>('session');
	$: user = $session?.user;

	// Categorized navigation
	const categories = [
		{
			name: 'Command',
			items: [
				{ href: '/', label: 'Home', icon: 'home' },
				{ href: '/base', label: 'Base', icon: 'target' },
				{ href: '/research', label: 'Research', icon: 'play' }
			]
		},
		{
			name: 'Operations',
			items: [
				{ href: '/galaxy', label: 'Galaxy Map', icon: 'globe' },
				{ href: '/fleet', label: 'Fleet', icon: 'menu' },
				{ href: '/shipyard', label: 'Shipyard', icon: 'dock' },
				{ href: '/reports', label: 'Reports', icon: 'clipboard' }
			]
		}
	];

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await goto('/');
		dispatch('navigate');
	}

	function isActive(path: string, current: string) {
		if (path === '/') return current === '/';
		return current === path || current.startsWith(path + '/');
	}

	function Icon({ name }: { name: string }) {
		// simple inline icons (heroicons-like)
		switch (name) {
			case 'home':
				return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6"/>`;
			case 'menu':
				return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M3 12h18M3 17h18"/>`;
			case 'dock':
				return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 21V7a2 2 0 00-2-2H6a2 2 0 00-2 2v14"/>`;
			case 'target':
				return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 1.567-3 3.5S10.343 15 12 15s3-1.567 3-3.5S13.657 8 12 8z"/>`;
			case 'shield':
				return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3l7 4v5c0 5-3.5 9-7 9s-7-4-7-9V7l7-4z"/>`;
			case 'play':
				return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5v14l11-7z"/>`;
			case 'user-plus':
				return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4m-2 8a6 6 0 1112 0H6zM19 8h3m-1.5-1.5v3"/>`;
			case 'login':
				return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H3m12 0l-4-4m4 4l-4 4M21 5v14"/>`;
			case 'globe':
				return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
			case 'clipboard':
				return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />`;
			default:
				return '';
		}
	}
</script>

<nav class="menu gap-2 p-2">
	<ul class="space-y-4">
		{#if user}
			{#each categories as cat}
				<li>
					<h2 class="menu-title px-3 text-xs font-bold uppercase tracking-wider opacity-50">{cat.name}</h2>
					<ul>
						{#each cat.items as l}
							<li>
								<a
									href={l.href}
									on:click={() => dispatch('navigate')}
									class="relative flex items-center gap-3 rounded px-3 py-2 transition-all duration-200 hover:bg-white/10 hover:text-neon-blue hover:shadow-[0_0_10px_rgba(0,243,255,0.2)]"
									class:bg-neon-blue-20={isActive(l.href, $page.url.pathname)}
									class:text-neon-blue={isActive(l.href, $page.url.pathname)}
									class:shadow-neon={isActive(l.href, $page.url.pathname)}
									aria-current={isActive(l.href, $page.url.pathname) ? 'page' : undefined}
								>
									<span
										class="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded bg-neon-blue shadow-[0_0_8px_var(--color-neon-blue)] opacity-0 transition-opacity duration-200"
										class:opacity-100={isActive(l.href, $page.url.pathname)}
									></span>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"><g>{@html Icon({ name: l.icon })}</g></svg
									>
									<span>{l.label}</span>
								</a>
							</li>
						{/each}
					</ul>
				</li>
			{/each}
			
			<div class="divider my-2"></div>
			
			<li>
				<button
					on:click={logout}
					class="relative flex items-center gap-3 rounded px-3 py-2 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 hover:shadow-[0_0_10px_rgba(248,113,113,0.2)] text-red-400/80"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"><g>{@html Icon({ name: 'login' })}</g></svg
					>
					<span>Logout</span>
				</button>
			</li>
		{:else}
			<li>
				<a
					href="/login"
					on:click={() => dispatch('navigate')}
					class="relative flex items-center gap-3 rounded px-3 py-2 transition hover:bg-base-100"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"><g>{@html Icon({ name: 'login' })}</g></svg
					>
					<span>Login</span>
				</a>
			</li>
		{/if}
	</ul>
</nav>

<style>
	a:hover svg {
		transform: translateX(1px);
		transition: transform 0.2s ease;
	}
	a[aria-current='page'] {
		font-weight: 600;
	}
	.bg-neon-blue-20 {
		background-color: rgba(0, 243, 255, 0.1);
	}
	.shadow-neon {
		box-shadow: 0 0 15px rgba(0, 243, 255, 0.15);
	}
</style>
