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
			try {
				window.dispatchEvent(new CustomEvent('player:changed'));
			} catch (e) {}
			await goto('/base');
		} else {
			const body = await res.json().catch(() => ({}));
			error = body?.error || 'registration_failed';
		}
	}
</script>

<div class="mx-auto max-w-md mt-10">
	<div class="glass-panel p-8 rounded-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
		<h2 class="mb-6 text-3xl font-bold font-display text-center text-neon-purple tracking-wide">Create Account</h2>
		<form on:submit={submit} class="space-y-5">
			<div class="form-control">
				<label class="label" for="register-username"><span class="label-text text-slate-300">Username</span></label
				>
				<input id="register-username" class="input input-bordered bg-white/5 border-white/10 text-white focus:border-neon-purple focus:outline-none transition-colors" bind:value={username} required />
			</div>
			<div class="form-control">
				<label class="label" for="register-password"><span class="label-text text-slate-300">Password</span></label
				>
				<input
					id="register-password"
					class="input input-bordered bg-white/5 border-white/10 text-white focus:border-neon-purple focus:outline-none transition-colors"
					type="password"
					bind:value={password}
					required
					minlength={6}
				/>
			</div>
			<div class="pt-4 flex items-center justify-between">
				<button class="btn bg-neon-purple text-black border-neon-purple hover:bg-neon-purple/80 hover:border-neon-purple font-bold tracking-wide shadow-[0_0_15px_rgba(168,85,247,0.3)]" type="submit">Register</button>
				<a class="link text-sm text-slate-400 hover:text-neon-blue transition-colors" href="/login">Already have an account?</a>
			</div>
		</form>
		{#if error}
			<div class="mt-4 alert alert-error bg-red-500/20 border-red-500/50 text-red-200">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				<span>{error}</span>
			</div>
		{/if}
	</div>
</div>
