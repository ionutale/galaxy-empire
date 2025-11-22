<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  export let systems: any[] = [];
  export let userId: string | null = null;
  
  let selectedSystem: any = null;
  // ... (existing code)

  // ... (existing code)

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
