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
			try {
				window.dispatchEvent(new CustomEvent('player:changed'));
			} catch (e) {}
			await goto('/base');
		} else {
			const body = await res.json().catch(() => ({}));
			error = body?.error || 'login_failed';
		}
	}
</script>

<div class="mx-auto max-w-md">
	<div class="card p-6">
		<h2 class="mb-4 text-xl font-semibold">Login</h2>
		<form on:submit={submit} class="space-y-3">
			<div class="form-control">
				<label class="label" for="login-username"><span class="label-text">Username</span></label>
				<input id="login-username" class="input-bordered input" bind:value={username} required />
			</div>
			<div class="form-control">
				<label class="label" for="login-password"><span class="label-text">Password</span></label>
				<input
					id="login-password"
					class="input-bordered input"
					type="password"
					bind:value={password}
					required
				/>
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
