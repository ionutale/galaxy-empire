<script lang="ts">
	export let type: string;
	export let size: string = 'w-full h-full';

	function getPlanetStyle(type: string) {
		switch (type) {
			case 'terrestrial':
				return 'background: radial-gradient(circle at 30% 30%, #4ade80 0%, #166534 60%, #14532d 100%); box-shadow: inset -4px -4px 20px rgba(0,0,0,0.8), 0 0 10px rgba(74, 222, 128, 0.3);';
			case 'ocean':
				return 'background: radial-gradient(circle at 30% 30%, #60a5fa 0%, #1e40af 60%, #1e3a8a 100%); box-shadow: inset -4px -4px 20px rgba(0,0,0,0.8), 0 0 15px rgba(96, 165, 250, 0.4);';
			case 'lava':
				return 'background: radial-gradient(circle at 30% 30%, #f87171 0%, #991b1b 50%, #450a0a 100%); box-shadow: inset -4px -4px 20px rgba(0,0,0,0.9), 0 0 15px rgba(248, 113, 113, 0.5);';
			case 'ice':
				return 'background: radial-gradient(circle at 30% 30%, #cffafe 0%, #22d3ee 50%, #0891b2 100%); box-shadow: inset -4px -4px 20px rgba(0,0,0,0.6), 0 0 15px rgba(34, 211, 238, 0.5);';
			case 'gas_giant':
				return 'background: linear-gradient(135deg, #fdba74 0%, #ea580c 50%, #9a3412 100%); box-shadow: inset -4px -4px 20px rgba(0,0,0,0.7);';
			case 'desert':
				return 'background: radial-gradient(circle at 30% 30%, #fde047 0%, #ca8a04 60%, #854d0e 100%); box-shadow: inset -4px -4px 20px rgba(0,0,0,0.7);';
			case 'barren':
				return 'background: radial-gradient(circle at 30% 30%, #d1d5db 0%, #6b7280 60%, #374151 100%); box-shadow: inset -4px -4px 20px rgba(0,0,0,0.8);';
			default:
				return 'background: #4b5563;';
		}
	}

    // Add some texture overlays using CSS patterns
    function getTexture(type: string) {
        if (type === 'gas_giant') {
            return 'background: repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(0,0,0,0.1) 5px, rgba(0,0,0,0.1) 10px); opacity: 0.5;';
        }
        if (type === 'terrestrial') {
             // Simple cloud-like patches
             return 'background-image: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 20%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 15%); opacity: 0.8;';
        }
        if (type === 'lava') {
            return 'background: repeating-radial-gradient(circle at 50% 50%, transparent, transparent 5px, rgba(0,0,0,0.2) 6px, rgba(0,0,0,0.2) 8px); opacity: 0.6;';
        }
        return '';
    }
</script>

<div class="{size} rounded-full relative overflow-hidden" style="{getPlanetStyle(type)}">
    <!-- Texture Layer -->
    <div class="absolute inset-0 rounded-full" style="{getTexture(type)}"></div>
    
    <!-- Shadow Layer for 3D effect -->
    <div class="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1)_0%,rgba(0,0,0,0)_40%,rgba(0,0,0,0.6)_85%,rgba(0,0,0,0.8)_100%)]"></div>
</div>
