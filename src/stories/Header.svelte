<script lang="ts">
	import Button from './Button.svelte';
	interface Props {
		user?: { name: string };
		onLogin?: () => void;
		onLogout?: () => void;
		onCreateAccount?: () => void;
	}
	const { user, onLogin, onLogout, onCreateAccount }: Props = $props();
</script>

<div class="navbar rounded-lg bg-base-100 p-2">
	<div class="flex-1 gap-2">
		<div class="flex items-center gap-3">
			<div class="placeholder avatar">
				<div class="bg-neutral-focus w-10 rounded-full text-neutral-content">G</div>
			</div>
			<div>
				<div class="font-bold">Galaxy Empire</div>
				<div class="text-muted text-sm">Demo</div>
			</div>
		</div>
	</div>
	<div class="flex-none">
		{#if user}
			<span class="mr-3">Welcome, <b>{user.name}</b></span>
			<Button size="sm" onclick={onLogout} label="Log out" />
		{:else}
			<Button size="sm" onclick={onLogin} label="Log in" />
			<Button primary size="sm" onclick={onCreateAccount} label="Sign up" />
		{/if}
	</div>
</div>
