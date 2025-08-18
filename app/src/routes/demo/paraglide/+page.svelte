<script lang="ts">
	import { setLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
</script>

<div class="max-w-2xl mx-auto">
	<div class="card shadow-lg bg-base-200 p-6">
		<h1 class="text-2xl font-bold mb-2">{m.hello_world({ name: 'Commander' })}</h1>
		<p class="text-sm text-muted">Switch language to preview localized content.</p>

		<div class="mt-4 flex gap-2">
			<button class="btn btn-outline" on:click={() => setLocale('en')}>English</button>
			<button class="btn btn-outline" on:click={() => setLocale('it')}>Italiano</button>
		</div>

		<div class="mt-4 text-sm">
			<p>If you use VSCode, install the <a class="link" href="https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension" target="_blank">inlang extension</a> for a better i18n experience.</p>
		</div>
	</div>
</div>
