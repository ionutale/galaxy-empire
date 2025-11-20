<script lang="ts">
	import toasts, { removeToast } from '$lib/stores/toast';
	import { fly } from 'svelte/transition';
</script>

<div class="fixed top-4 right-4 z-[99] space-y-2">
	{#each $toasts as t (t.id)}
		<div
			in:fly={{ y: -10 }}
			out:fly={{ y: -10 }}
			class="z-[999] max-w-xs rounded-lg p-4 shadow-[0_0_15px_rgba(0,0,0,0.5)] border backdrop-blur-md"
			class:bg-emerald-900_80={t.type === 'success'}
			class:border-emerald-500_50={t.type === 'success'}
			class:text-emerald-100={t.type === 'success'}
			class:bg-red-900_80={t.type === 'error'}
			class:border-red-500_50={t.type === 'error'}
			class:text-red-100={t.type === 'error'}
			class:bg-slate-800_80={t.type === 'info'}
			class:border-slate-500_50={t.type === 'info'}
			class:text-slate-200={t.type === 'info'}
			style:background-color={t.type === 'success' ? 'rgba(6, 78, 59, 0.8)' : t.type === 'error' ? 'rgba(127, 29, 29, 0.8)' : 'rgba(30, 41, 59, 0.8)'}
			style:border-color={t.type === 'success' ? 'rgba(16, 185, 129, 0.5)' : t.type === 'error' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(100, 116, 139, 0.5)'}
		>
			<div class="flex items-start justify-between gap-3">
				<div class="text-sm font-medium leading-snug">{t.message}</div>
				<button class="btn btn-ghost btn-xs btn-circle -mt-1 -mr-1 opacity-70 hover:opacity-100" on:click={() => removeToast(t.id)}>×</button>
			</div>
		</div>
	{/each}
</div>
