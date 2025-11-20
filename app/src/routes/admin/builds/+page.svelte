<script lang="ts">
	import { onMount } from 'svelte';
	type BuildItem = {
		id: string;
		shipTemplateId: string;
		quantity: number;
		processedAt: string | number;
		rolledBack?: boolean;
	};
	let builds: BuildItem[] = [];
	let adminKey = '';
	let error = '';
	let loading = false;
	let lastLoaded: Date | null = null;

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/admin/processed-builds', {
				headers: { 'x-admin-key': adminKey }
			});
			if (res.ok) builds = (await res.json()).items || [];
			else {
				builds = [];
				error = 'auth_failed';
			}
			lastLoaded = new Date();
		} catch (e) {
			error = 'network_error';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function rollback(id: string) {
		try {
			const res = await fetch('/api/admin/processed-builds/rollback', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'x-admin-key': adminKey },
				body: JSON.stringify({ id })
			});
			if (res.ok) await load();
			else error = 'rollback_failed';
		} catch (e) {
			error = 'network_error';
		}
	}
</script>

<div class="mx-auto max-w-4xl space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold">Processed Builds</h2>
			<p class="text-muted text-sm">Roll back builds processed by the worker.</p>
		</div>
		<div class="text-muted text-right text-sm">
			{#if lastLoaded}
				<div>Last loaded: {lastLoaded.toLocaleString()}</div>
			{/if}
			<div>{loading ? 'Loading…' : ''}</div>
		</div>
	</div>

	<div class="card p-4">
		<div class="form-control">
			<label class="label" for="admin-key-builds"><span class="label-text">Admin Key</span></label>
			<div class="flex gap-2">
				<input
					id="admin-key-builds"
					class="input-bordered input flex-1"
					bind:value={adminKey}
					placeholder="paste admin key"
				/>
				<button class="btn btn-primary" on:click={load} disabled={loading}
					>{loading ? 'Loading…' : 'Load'}</button
				>
			</div>
		</div>
		{#if error}
			<div class="mt-3 alert alert-error">{error}</div>
		{/if}
	</div>

	<section class="card p-4">
		<div class="flex items-center justify-between">
			<h3 class="font-semibold">Entries</h3>
			<div class="text-muted text-sm">{builds.length} items</div>
		</div>
		<div class="divider"></div>
		{#if builds.length === 0}
			<p class="text-muted">No processed builds</p>
		{:else}
			<div class="space-y-2">
				{#each builds as b}
					<div class="flex items-center justify-between rounded border p-2">
						<div>
							<div class="font-medium">{b.shipTemplateId} x{b.quantity}</div>
							<div class="text-muted text-sm">
								Processed: {new Date(b.processedAt).toLocaleString()}
							</div>
						</div>
						<div>
							{#if !b.rolledBack}
								<button
									class="btn btn-sm btn-warning"
									on:click={() => {
										if (confirm('Rollback build?')) rollback(b.id);
									}}
									disabled={loading}>Rollback</button
								>
							{:else}
								<span class="badge">Rolled back</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>
