<script lang="ts">
	import { onMount } from 'svelte';
	type BuildItem = {
		id: string;
		shipTemplateId: string;
		quantity: number;
		processedAt: string | number;
		rolledBack?: boolean;
	};
	type MissionItem = {
		id: string;
		shipTemplateId: string;
		quantity: number;
		completedAt: string | number;
		outcome?: string;
		rolledBack?: boolean;
	};
	type ActiveBuild = {
		id: string;
		type: string;
		status: string;
		remainingSeconds?: number;
		[k: string]: any;
	};

	let builds: BuildItem[] = [];
	let missions: MissionItem[] = [];
	let activeBuilds: ActiveBuild[] = [];
	let adminKey = '';
	let error = '';
	let loading = false;
	let lastLoaded: Date | null = null;

	async function load() {
		loading = true;
		error = '';
		if (adminKey) localStorage.setItem('adminKey', adminKey);

		try {
			const [rb, rm, ra] = await Promise.all([
				fetch('/api/admin/processed-builds', { headers: { 'x-admin-key': adminKey } }),
				fetch('/api/admin/processed-missions', { headers: { 'x-admin-key': adminKey } }),
				fetch('/api/admin/active-builds', { headers: { 'x-admin-key': adminKey } })
			]);

			if (rb.ok) {
				builds = (await rb.json()).items || [];
			} else {
				builds = [];
				error = 'auth_failed_builds';
			}

			if (rm.ok) {
				missions = (await rm.json()).items || [];
			} else {
				missions = [];
				error = error || 'auth_failed_missions';
			}

			if (ra.ok) {
				activeBuilds = (await ra.json()).items || [];
			} else {
				activeBuilds = [];
			}

			lastLoaded = new Date();
		} catch (e) {
			error = 'network_error';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		const stored = localStorage.getItem('adminKey');
		if (stored) {
			adminKey = stored;
			load();
		}
	});

	async function forceTick() {
		try {
			const res = await fetch('/api/admin/force-tick', {
				method: 'POST',
				headers: { 'x-admin-key': adminKey }
			});
			if (res.ok) {
				await load();
				alert('Tick processed');
			} else {
				alert('Tick failed');
			}
		} catch (e) {
			alert('Network error');
		}
	}

	async function rollbackBuild(id: string) {
		try {
			const res = await fetch('/api/admin/processed-builds/rollback', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'x-admin-key': adminKey },
				body: JSON.stringify({ id })
			});
			if (res.ok) await load();
			else error = 'rollback_failed_build';
		} catch (e) {
			error = 'network_error';
		}
	}

	async function rollbackMission(id: string) {
		try {
			const res = await fetch('/api/admin/processed-missions/rollback', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'x-admin-key': adminKey },
				body: JSON.stringify({ id })
			});
			if (res.ok) await load();
			else error = 'rollback_failed_mission';
		} catch (e) {
			error = 'network_error';
		}
	}
</script>

<div class="mx-auto max-w-5xl space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold">Admin Overview</h2>
			<p class="text-muted text-sm">
				Inspect processed builds and missions, and rollback if needed.
			</p>
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
			<label class="label" for="admin-key-overview"><span class="label-text">Admin Key</span></label
			>
			<div class="flex gap-2">
				<input
					id="admin-key-overview"
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

	<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
		<div class="card p-4">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-muted text-sm">Active Queue</div>
					<div class="text-2xl font-semibold">{activeBuilds.length}</div>
				</div>
			</div>
		</div>

		<div class="card p-4">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-muted text-sm">Processed builds</div>
					<div class="text-2xl font-semibold">{builds.length}</div>
				</div>
			</div>
		</div>

		<div class="card p-4">
			<div class="flex items-center justify-between">
				<div>
					<div class="text-muted text-sm">Processed missions</div>
					<div class="text-2xl font-semibold">{missions.length}</div>
				</div>
			</div>
		</div>

		<div class="card p-4">
			<div class="text-muted text-sm">Actions</div>
			<div class="mt-2">
				<button class="btn w-full btn-sm btn-warning" on:click={forceTick} disabled={loading}
					>Force Tick</button
				>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<section class="card col-span-1 p-4 md:col-span-2">
			<h3 class="font-semibold">Active Queue</h3>
			<div class="divider"></div>
			{#if activeBuilds.length === 0}
				<p class="text-muted">No active builds</p>
			{:else}
				<div class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
					{#each activeBuilds as b}
						<div class="rounded border bg-base-200 p-2">
							<div class="font-medium">
								{b.type === 'building' ? b.buildingId : b.shipType || b.techId || b.type}
							</div>
							<div class="text-muted text-xs">ID: {b.id}</div>
							<div class="text-sm">
								Status: <span class="badge badge-sm badge-info">{b.status}</span>
							</div>
							<div class="text-sm">Remaining: {b.remainingSeconds}s</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<section class="card p-4">
			<h3 class="font-semibold">Processed Builds</h3>
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
							<div class="flex items-center gap-2">
								{#if !b.rolledBack}
									<button
										class="btn btn-sm btn-warning"
										on:click={() => {
											if (confirm('Rollback build?')) rollbackBuild(b.id);
										}}
										disabled={loading}
										aria-disabled={loading}
										title="Rollback build">Rollback</button
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

		<section class="card p-4">
			<h3 class="font-semibold">Processed Missions</h3>
			<div class="divider"></div>
			{#if missions.length === 0}
				<p class="text-muted">No processed missions</p>
			{:else}
				<div class="space-y-2">
					{#each missions as m}
						<div class="flex items-center justify-between rounded border p-2">
							<div>
								<div class="font-medium">{m.shipTemplateId} x{m.quantity} — {m.outcome}</div>
								<div class="text-muted text-sm">
									Completed: {new Date(m.completedAt).toLocaleString()}
								</div>
							</div>
							<div class="flex items-center gap-2">
								{#if !m.rolledBack}
									<button
										class="btn btn-sm btn-warning"
										on:click={() => {
											if (confirm('Rollback mission?')) rollbackMission(m.id);
										}}
										disabled={loading}
										aria-disabled={loading}
										title="Rollback mission">Rollback</button
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
</div>
