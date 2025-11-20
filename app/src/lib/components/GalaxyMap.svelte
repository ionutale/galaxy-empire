<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  export let systems: any[] = [];
  
  let selectedSystem: any = null;
  let transform = { x: 0, y: 0, k: 1 };
  let width = 800;
  let height = 600;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const scaleFactor = 1.1;
    const direction = e.deltaY > 0 ? 1 / scaleFactor : scaleFactor;
    transform.k = Math.max(0.1, Math.min(5, transform.k * direction));
  }

  function handleMouseDown(e: MouseEvent) {
    dragging = true;
    startX = e.clientX - transform.x;
    startY = e.clientY - transform.y;
  }

  function handleMouseMove(e: MouseEvent) {
    if (!dragging) return;
    transform.x = e.clientX - startX;
    transform.y = e.clientY - startY;
  }

  function handleMouseUp() {
    dragging = false;
  }

  function selectSystem(sys: any) {
    selectedSystem = sys;
  }
</script>

<div class="relative w-full h-[600px] bg-black overflow-hidden border border-gray-800 rounded-lg"
     role="application"
     aria-label="Galaxy Map"
     on:wheel={handleWheel}
     on:mousedown={handleMouseDown}
     on:mousemove={handleMouseMove}
     on:mouseup={handleMouseUp}
     on:mouseleave={handleMouseUp}>
  
  <!-- Stars Background -->
  <div class="absolute inset-0 pointer-events-none opacity-50" 
       style="background-image: radial-gradient(white 1px, transparent 1px); background-size: 50px 50px;">
  </div>

  <svg {width} {height} class="absolute inset-0 w-full h-full cursor-move">
    <g transform="translate({width/2 + transform.x}, {height/2 + transform.y}) scale({transform.k})">
      <!-- Grid Lines (Optional) -->
      <g class="opacity-10 stroke-gray-500">
        {#each Array(21) as _, i}
          <line x1={-1000} y1={(i-10)*100} x2={1000} y2={(i-10)*100} stroke-width="1" />
          <line x1={(i-10)*100} y1={-1000} x2={(i-10)*100} y2={1000} stroke-width="1" />
        {/each}
      </g>

      <!-- Systems -->
      {#each systems as sys}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <g transform="translate({sys.x * 10}, {sys.y * 10})" 
           class="cursor-pointer hover:opacity-80 transition-opacity"
           on:click|stopPropagation={() => selectSystem(sys)}>
          <circle r={4/transform.k + 2} fill={selectedSystem?.id === sys.id ? '#fbbf24' : '#60a5fa'} />
          <text y={-10/transform.k} 
                text-anchor="middle" 
                fill="white" 
                font-size={12/transform.k} 
                class="pointer-events-none select-none opacity-70">
            {sys.name}
          </text>
        </g>
      {/each}
    </g>
  </svg>

  <!-- System Details Panel -->
  {#if selectedSystem}
    <div class="absolute top-4 right-4 w-64 bg-base-200/90 backdrop-blur p-4 rounded shadow-xl border border-base-300" transition:fade>
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold text-lg">{selectedSystem.name}</h3>
        <button class="btn btn-ghost btn-xs" on:click={() => selectedSystem = null}>✕</button>
      </div>
      <p class="text-xs text-muted mb-4">Coordinates: {selectedSystem.x}, {selectedSystem.y}</p>
      
      <h4 class="font-semibold text-sm mb-2">Planets</h4>
      <div class="space-y-2 max-h-60 overflow-y-auto">
        {#each selectedSystem.planets as planet}
          <div class="bg-base-300 p-2 rounded text-sm flex items-center gap-2 justify-between group">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" 
                   class:bg-blue-400={planet.type==='ocean'}
                   class:bg-green-500={planet.type==='terrestrial'}
                   class:bg-red-500={planet.type==='lava'}
                   class:bg-cyan-200={planet.type==='ice'}
                   class:bg-orange-300={planet.type==='gas_giant'}
                   class:bg-yellow-200={planet.type==='desert'}
                   class:bg-gray-400={planet.type==='barren'}>
              </div>
              <div>
                <div class="font-medium">{planet.name}</div>
                <div class="text-xs opacity-70 capitalize">{planet.type}</div>
              </div>
            </div>
            <a href="/fleet/dispatch?targetSystem={selectedSystem.id}&planet={planet.orbitIndex}" 
               class="btn btn-xs btn-error opacity-0 group-hover:opacity-100 transition-opacity">
              Attack
            </a>
          </div>
        {/each}
      </div>

      <div class="mt-4 pt-4 border-t border-base-300">
        <a href="/fleet/dispatch?targetSystem={selectedSystem.id}" class="btn btn-primary btn-sm w-full">Send Fleet</a>
      </div>
    </div>
  {/if}

  <!-- Controls -->
  <div class="absolute bottom-4 right-4 flex flex-col gap-2">
    <button class="btn btn-square btn-sm bg-base-200/80" on:click={() => transform.k = Math.min(5, transform.k * 1.2)}>+</button>
    <button class="btn btn-square btn-sm bg-base-200/80" on:click={() => transform.k = Math.max(0.1, transform.k / 1.2)}>-</button>
    <button class="btn btn-square btn-sm bg-base-200/80" on:click={() => { transform = { x: 0, y: 0, k: 1 }; }}>⟲</button>
  </div>
</div>
