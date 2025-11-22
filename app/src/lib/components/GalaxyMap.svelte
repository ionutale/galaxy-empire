<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  export let systems: any[] = [];
  export let userHomeSystem: number | null = null;
  export let userId: string | null = null;
  
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

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="relative w-full h-[600px] glass-panel overflow-hidden rounded-xl"
     role="application"
     aria-label="Galaxy Map"
     on:wheel={handleWheel}
     on:mousedown={handleMouseDown}
     on:mousemove={handleMouseMove}
     on:mouseup={handleMouseUp}
     on:mouseleave={handleMouseUp}>
  
  <!-- Stars Background (Transparent to show global background) -->
  <div class="absolute inset-0 pointer-events-none opacity-30" 
       style="background-image: radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px); background-size: 50px 50px;">
  </div>

  <svg {width} {height} class="absolute inset-0 w-full h-full cursor-move">
    <g transform="translate({width/2 + transform.x}, {height/2 + transform.y}) scale({transform.k})">
      <!-- Grid Lines -->
      <g class="opacity-20 stroke-neon-blue">
        {#each Array(21) as _, i}
          <line x1={-1000} y1={(i-10)*100} x2={1000} y2={(i-10)*100} stroke-width="0.5" />
          <line x1={(i-10)*100} y1={-1000} x2={(i-10)*100} y2={1000} stroke-width="0.5" />
        {/each}
      </g>

      <!-- Systems -->
      {#each systems as sys}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <g transform="translate({sys.x * 10}, {sys.y * 10})" 
           class="cursor-pointer hover:opacity-80 transition-opacity"
           on:click|stopPropagation={() => selectSystem(sys)}>
          <circle r={4/transform.k + 2} 
                  fill={selectedSystem?.id === sys.id ? '#fbbf24' : (sys.id === userHomeSystem ? '#ff0000' : '#00f3ff')} 
                  class:filter={selectedSystem?.id === sys.id || sys.id === userHomeSystem}
                  class:drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]={selectedSystem?.id === sys.id}
                  class:drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]={sys.id === userHomeSystem && selectedSystem?.id !== sys.id}
                  class:drop-shadow-[0_0_5px_rgba(0,243,255,0.6)]={selectedSystem?.id !== sys.id && sys.id !== userHomeSystem}
          />
          <text y={-10/transform.k} 
                text-anchor="middle" 
                fill={sys.id === userHomeSystem ? '#ff0000' : 'white'} 
                font-size={12/transform.k} 
                class="pointer-events-none select-none opacity-80 font-display tracking-wider text-shadow-sm">
            {sys.name}
          </text>
        </g>
      {/each}
    </g>
  </svg>

  <!-- System Details Panel -->
  {#if selectedSystem}
    <div class="absolute top-4 right-4 w-72 glass-panel p-4 rounded-lg shadow-2xl border border-white/10 backdrop-blur-xl" 
         transition:fade
         on:wheel|stopPropagation>
      <div class="flex justify-between items-start mb-3 border-b border-white/10 pb-2">
        <h3 class="font-display font-bold text-lg text-neon-blue tracking-wide">{selectedSystem.name}</h3>
        <button class="btn btn-ghost btn-xs text-white/50 hover:text-white" on:click={() => selectedSystem = null}>✕</button>
      </div>
      <p class="text-xs text-slate-400 mb-4 font-mono">COORDS: [{selectedSystem.x}, {selectedSystem.y}]</p>
      
      <h4 class="font-display font-semibold text-sm mb-3 text-slate-200 uppercase tracking-wider">Planets Detected</h4>
      <div class="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {#each selectedSystem.planets as planet}
          <div class="bg-white/5 p-2 rounded border border-white/5 flex items-center gap-3 justify-between group hover:bg-white/10 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full shadow-[0_0_5px_currentColor]" 
                   class:text-blue-400={planet.type==='ocean'} class:bg-blue-400={planet.type==='ocean'}
                   class:text-green-500={planet.type==='terrestrial'} class:bg-green-500={planet.type==='terrestrial'}
                   class:text-red-500={planet.type==='lava'} class:bg-red-500={planet.type==='lava'}
                   class:text-cyan-200={planet.type==='ice'} class:bg-cyan-200={planet.type==='ice'}
                   class:text-orange-300={planet.type==='gas_giant'} class:bg-orange-300={planet.type==='gas_giant'}
                   class:text-yellow-200={planet.type==='desert'} class:bg-yellow-200={planet.type==='desert'}
                   class:text-gray-400={planet.type==='barren'} class:bg-gray-400={planet.type==='barren'}>
              </div>
              <div>
                <div class="font-medium text-slate-200 text-sm">{planet.name}</div>
                <div class="text-[10px] opacity-60 uppercase tracking-wide">{planet.type}</div>
              </div>
            </div>
            {#if planet.ownerId !== userId}
            <a href="/fleet/dispatch?targetSystem={selectedSystem.id}&planet={planet.orbitIndex}" 
               class="btn btn-xs btn-outline border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 opacity-0 group-hover:opacity-100 transition-all">
              Attack
            </a>
            {/if}
          </div>
        {/each}
      </div>

      <div class="mt-4 pt-4 border-t border-white/10">
        <a
							href="/fleet/dispatch?targetSystem={selectedSystem.id}&planet=1"
							class="btn btn-sm bg-neon-blue text-black border-neon-blue hover:bg-neon-blue/80 hover:border-neon-blue font-bold"
						>
							Dispatch Fleet
						</a>
      </div>
    </div>
  {/if}

  <!-- Controls -->
  <div class="absolute bottom-4 right-4 flex flex-col gap-2">
    <button class="btn btn-square btn-sm glass-panel hover:bg-white/10 text-white" on:click={() => transform.k = Math.min(5, transform.k * 1.2)}>+</button>
    <button class="btn btn-square btn-sm glass-panel hover:bg-white/10 text-white" on:click={() => transform.k = Math.max(0.1, transform.k / 1.2)}>-</button>
    <button class="btn btn-square btn-sm glass-panel hover:bg-white/10 text-white" on:click={() => { transform = { x: 0, y: 0, k: 1 }; }}>⟲</button>
  </div>
</div>
