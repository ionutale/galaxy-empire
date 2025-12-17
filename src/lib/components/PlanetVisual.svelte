<script lang="ts">
	export let type: string;
	export let size: string = 'w-full h-full';

    // Map planet types to image files
    const PLANET_IMAGES: Record<string, string[]> = {
        terrestrial: ['planet-earth-simil.png', 'planet-green-with-water.png'],
        ocean: ['planet-blue-gray-ded.png'],
        lava: ['planet-red-hot.png', 'planet-yellow-red-hot-burning.png'],
        ice: ['planet-blue-ice-cold.png'],
        gas_giant: ['planet-surounded-by-gas.png'],
        desert: ['planet-sand.png', 'planet-yellow-sand.png', 'planet-yellow-sand-2.png', 'planet-sand-with-dust-rings.png'],
        barren: ['planet base.jpg', 'planet-base-2.jpg']
    };
    
    function getImage(type: string) {
        const images = PLANET_IMAGES[type] || PLANET_IMAGES['barren'];
        return '/images/planets/' + images[Math.floor(Math.random() * images.length)];
    }
</script>

<div class="{size} relative flex items-center justify-center">
    <img 
        src={getImage(type)} 
        alt={type} 
        class="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        loading="lazy"
    />
    
    <!-- Optional: Add an atmospheric glow based on type -->
    {#if type === 'lava'}
        <div class="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(248,113,113,0.4)] pointer-events-none"></div>
    {:else if type === 'ice'}
        <div class="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.3)] pointer-events-none"></div>
    {:else if type === 'terrestrial'}
        <div class="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(74,222,128,0.2)] pointer-events-none"></div>
    {/if}
</div>
