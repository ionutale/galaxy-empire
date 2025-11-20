<script lang="ts">
  export let id: string;
  export let className = '';

  const icons: Record<string, string> = {
    controlCenter: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="8" width="18" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M12 3v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    metalMine: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21h18L12 3 3 21z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    crystalSynthesizer: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z" stroke="currentColor" stroke-width="1"/></svg>',
    deuteriumRefinery: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M8 12h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    shipyard: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12h20v6H2z" stroke="currentColor" stroke-width="1.5"/><path d="M8 12V6h8v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    researchLab: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21h18" stroke="currentColor" stroke-width="1.5"/><path d="M8 7a4 4 0 118 0v8H8V7z" stroke="currentColor" stroke-width="1.2"/></svg>'
  };
</script>

<div aria-hidden="true" class={className}>
  {@html icons[id] ?? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.2"/></svg>'}
</div>
