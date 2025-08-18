<script lang="ts">
  import { page } from '$app/stores';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{navigate: void}>();

  // Simplified core navigation
  const links = [
    { href: '/', label: 'Home', icon: 'home' },
    { href: '/base', label: 'Base', icon: 'target' },
    { href: '/fleet', label: 'Fleet', icon: 'menu' },
  { href: '/shipyard', label: 'Shipyard', icon: 'dock' },
  { href: '/admin/overview', label: 'Admin', icon: 'user-plus' }
  ];
  links.splice(2,0,{ href: '/research', label: 'Research', icon: 'play' });

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
      default:
        return '';
    }
  }
</script>

<nav class="menu p-2 gap-2">
  <ul class="space-y-1">
    {#each links as l}
      {#key l.href}
        <li>
          <a href={l.href}
            on:click={() => dispatch('navigate')}
            class="relative flex items-center gap-3 px-3 py-2 rounded transition hover:bg-base-100"
            class:bg-base-100={isActive(l.href, $page.url.pathname)}
            aria-current={isActive(l.href, $page.url.pathname) ? 'page' : undefined}
          >
            <span class="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded bg-primary opacity-0" class:opacity-100={isActive(l.href, $page.url.pathname)}></span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><g>{@html Icon({ name: l.icon })}</g></svg>
            <span>{l.label}</span>
          </a>
        </li>
      {/key}
    {/each}
  </ul>
</nav>

<style>
  a:hover svg { transform: translateX(1px); transition: transform .2s ease; }
  a[aria-current="page"] { font-weight: 600; }
</style>
