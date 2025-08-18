<script lang="ts">
  import { goto } from '$app/navigation';
  let username = '';
  let password = '';
  let error = '';

  async function submit(e: Event) {
    e.preventDefault();
    error = '';
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      await goto('/base');
    } else {
      const body = await res.json().catch(() => ({}));
      error = body?.error || 'login_failed';
    }
  }
</script>

<div class="max-w-md mx-auto">
  <div class="card p-6">
    <h2 class="text-xl font-semibold mb-4">Login</h2>
    <form on:submit={submit} class="space-y-3">
      <div class="form-control">
        <label class="label"><span class="label-text">Username</span></label>
        <input class="input input-bordered" bind:value={username} required />
      </div>
      <div class="form-control">
        <label class="label"><span class="label-text">Password</span></label>
        <input class="input input-bordered" type="password" bind:value={password} required />
      </div>
      <div class="flex items-center justify-between">
        <button class="btn btn-primary" type="submit">Login</button>
        <a class="link" href="/register">Create account</a>
      </div>
    </form>
    {#if error}
      <div class="mt-3 alert alert-error">{error}</div>
    {/if}
  </div>
</div>
