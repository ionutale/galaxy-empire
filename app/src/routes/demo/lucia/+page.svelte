<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<div class="max-w-md mx-auto">
	<div class="card p-6">
		<h1 class="text-xl font-semibold">Welcome back, {data.user.username}!</h1>
		<p class="text-sm text-muted">User ID: {data.user.id}</p>
		<form method="post" action="?/logout" use:enhance class="mt-4">
			<button class="btn btn-error">Sign out</button>
		</form>
	</div>
</div>
