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

<h2>Login</h2>
<form on:submit={submit}>
  <label>Username
    <input bind:value={username} required />
  </label>
  <label>Password
    <input type="password" bind:value={password} required />
  </label>
  <button type="submit">Login</button>
</form>
{#if error}
<p style="color:var(--error)">{error}</p>
{/if}
