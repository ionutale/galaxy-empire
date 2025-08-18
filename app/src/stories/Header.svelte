<script lang="ts">
  import Button from './Button.svelte';
  interface Props { user?: { name: string }; onLogin?: () => void; onLogout?: () => void; onCreateAccount?: () => void }
  const { user, onLogin, onLogout, onCreateAccount }: Props = $props();
</script>

<div class="navbar bg-base-100 p-2 rounded-lg">
  <div class="flex-1 gap-2">
    <div class="flex items-center gap-3">
      <div class="avatar placeholder">
        <div class="bg-neutral-focus text-neutral-content rounded-full w-10">G</div>
      </div>
      <div>
        <div class="font-bold">Galaxy Empire</div>
        <div class="text-sm text-muted">Demo</div>
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
