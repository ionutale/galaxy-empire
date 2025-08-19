<script lang="ts">
  import { goto } from '$app/navigation';
  let username = '';
  let password = '';
  let error = '';

  async function submit(e: Event) {
    e.preventDefault();
    error = '';
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
  try { window.dispatchEvent(new CustomEvent('player:changed')); } catch (e) {}
  await goto('/base');
    } else {
      const body = await res.json().catch(() => ({}));
      error = body?.error || 'registration_failed';
    }
  }
</script>

<div class="max-w-md mx-auto">
  <div class="card p-6">
    <h2 class="text-xl font-semibold mb-4">Create account</h2>
    <form on:submit={submit} class="space-y-3">
      <div class="form-control">
        <label class="label" for="register-username"><span class="label-text">Username</span></label>
        <input id="register-username" class="input input-bordered" bind:value={username} required />
      </div>
      <div class="form-control">
        <label class="label" for="register-password"><span class="label-text">Password</span></label>
        <input id="register-password" class="input input-bordered" type="password" bind:value={password} required minlength={6} />
      </div>
      <div class="flex items-center justify-between">
        <button class="btn btn-primary" type="submit">Register</button>
        <a class="link" href="/login">Already have an account?</a>
      </div>
    </form>
    {#if error}
      <div class="mt-3 alert alert-error">{error}</div>
    {/if}
  </div>
</div>
