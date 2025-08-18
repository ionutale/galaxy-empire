<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="max-w-md mx-auto">
	<div class="card p-6">
		<h1 class="text-xl font-semibold mb-3">Login / Register</h1>
		<form method="post" action="?/login" use:enhance class="space-y-3">
			<div class="form-control">
				<label class="label" for="lucia-username"><span class="label-text">Username</span></label>
				<input id="lucia-username" name="username" class="input input-bordered" />
			</div>
			<div class="form-control">
				<label class="label" for="lucia-password"><span class="label-text">Password</span></label>
				<input id="lucia-password" type="password" name="password" class="input input-bordered" />
			</div>
			<div class="flex gap-2">
				<button class="btn btn-primary">Login</button>
				<button formaction="?/register" class="btn btn-secondary">Register</button>
			</div>
		</form>
		{#if form?.message}
			<div class="mt-3 alert alert-error">{form.message}</div>
		{/if}
	</div>
</div>
