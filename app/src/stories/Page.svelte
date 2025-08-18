<script lang="ts">
  import Header from './Header.svelte';
  let user: { name: string } | undefined;
</script>

<div class="space-y-4">
  <Header {user} onLogin={() => (user = { name: 'Jane Doe' })} onLogout={() => (user = undefined)} onCreateAccount={() => (user = { name: 'Jane Doe' })} />

  <div class="card p-6">
    <h2 class="text-lg font-semibold">Pages in Storybook</h2>
    <p class="mt-2 text-sm text-muted">Build UIs with a component-driven approach. Mock data for pages and compose components to create full layouts.</p>
    <div class="mt-4 grid grid-cols-1 gap-3">
      <a class="btn btn-outline" href="https://storybook.js.org/tutorials/" target="_blank">Storybook tutorials</a>
      <a class="btn btn-outline" href="https://storybook.js.org/docs" target="_blank">Storybook docs</a>
    </div>
  </div>
</div>
