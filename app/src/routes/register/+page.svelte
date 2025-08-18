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
      await goto('/base');
    } else {
      const body = await res.json().catch(() => ({}));
      error = body?.error || 'registration_failed';
    }
  }
</script>

<h2>Create account</h2>
<form on:submit={submit}>
  <label>Username
    <input bind:value={username} required />
  </label>
  <label>Password
    <input type="password" bind:value={password} required minlength={6} />
  </label>
  <button type="submit">Register</button>
</form>
{#if error}
<p style="color:var(--error)">{error}</p>
{/if}
