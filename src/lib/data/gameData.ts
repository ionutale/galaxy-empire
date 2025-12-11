export type CostFunc = (level: number) => Record<string, number>;
export type TimeFunc = (level: number) => number;

export interface BuildingDef {
	name: string;
	description?: string;
	category?: string;
	cost?: CostFunc;
	time?: TimeFunc;
	production?: (level: number) => number;
	requires?: Record<string, any>;
	benefit?: string | ((level: number) => string);
	[k: string]: any;
}

export interface ShipTemplate {
	shipId: string;
	name: string;
	role: string;
	hp?: number;
	attack?: number;
	defense?: number;
	speed?: number;
	capacity?: number;
	buildCost?: Record<string, number>;
	buildTime?: number;
	[k: string]: any;
}

export interface ResearchDef {
	name: string;
	description?: string;
	cost?: CostFunc;
	time?: TimeFunc;
	effect?: string | ((level: number) => string);
	[k: string]: any;
}

export const BUILDING_DATA: Record<string, BuildingDef> = {
	controlCenter: {
		name: 'Control Center',
		category: 'Facilities',
		description:
			'The heart of your colony. Upgrading unlocks new buildings and expands build slots.',
		cost: (level: number) => ({
			metal: Math.round(100 * Math.pow(1.8, level)),
			crystal: Math.round(50 * Math.pow(1.8, level))
		}),
		time: (level: number) => Math.round(60 * Math.pow(1.5, level)),
		production: (level: number) => Math.round(20 * level * Math.pow(1.1, level)),
		benefit: (level: number) => `Unlocks new building options. Produces ${Math.round(20 * level * Math.pow(1.1, level))} credits/hr.`
	},
	metalMine: {
		name: 'Metal Mine',
		category: 'Resources',
		description: "Extracts and refines metal ore from the planet's crust.",
		cost: (level: number) => ({
			metal: Math.round(60 * Math.pow(1.5, level)),
			crystal: Math.round(15 * Math.pow(1.5, level))
		}),
		time: (level: number) => Math.round(45 * Math.pow(1.6, level)),
		production: (level: number) => Math.round(30 * level * Math.pow(1.1, level)),
		benefit: (level: number) => `Production/hr: ${Math.round(30 * level * Math.pow(1.1, level))}`
	},
	crystalSynthesizer: {
		name: 'Crystal Synthesizer',
		category: 'Resources',
		description: 'Grows valuable crystals used in advanced electronics and research.',
		cost: (level: number) => ({
			metal: Math.round(48 * Math.pow(1.6, level)),
			crystal: Math.round(24 * Math.pow(1.6, level))
		}),
		time: (level: number) => Math.round(50 * Math.pow(1.6, level)),
		production: (level: number) => Math.round(20 * level * Math.pow(1.1, level)),
		benefit: (level: number) => `Production/hr: ${Math.round(20 * level * Math.pow(1.1, level))}`
	},
	deuteriumRefinery: {
		name: 'Deuterium Refinery',
		category: 'Resources',
		description: 'Synthesizes Deuterium, the fuel for your fleets.',
		cost: (level: number) => ({
			metal: Math.round(225 * Math.pow(1.5, level)),
			crystal: Math.round(75 * Math.pow(1.5, level))
		}),
		time: (level: number) => Math.round(120 * Math.pow(1.7, level)),
		production: (level: number) => Math.round(10 * level * Math.pow(1.1, level)),
		benefit: (level: number) => `Production/hr: ${Math.round(10 * level * Math.pow(1.1, level))}`
	},
	shipyard: {
		name: 'Shipyard',
		category: 'Facilities',
		description: 'Constructs your fleets and defensive structures.',
		cost: (level: number) => ({
			metal: Math.round(400 * Math.pow(2, level)),
			crystal: Math.round(200 * Math.pow(2, level))
		}),
		time: (level: number) => Math.round(300 * Math.pow(1.8, level)),
		requires: { building: 'controlCenter', level: 2 },
		benefit: (level: number) => `Reduces ship construction time.`
	},
	researchLab: {
		name: 'Research Lab',
		category: 'Facilities',
		description: 'Unlocks powerful new technologies for your empire.',
		cost: (level: number) => ({
			metal: Math.round(200 * Math.pow(2, level)),
			crystal: Math.round(400 * Math.pow(2, level))
		}),
		time: (level: number) => Math.round(300 * Math.pow(1.8, level)),
		requires: { building: 'controlCenter', level: 1 },
		benefit: (level: number) => `Reduces research time.`
	},
	terraformer: {
		name: 'Terraformer',
		category: 'Terraforming',
		description: 'Improves planet habitability and increases maximum population/production.',
		cost: (level: number) => ({
			metal: Math.round(1000 * Math.pow(1.9, level)),
			crystal: Math.round(800 * Math.pow(1.9, level))
		}),
		time: (level: number) => Math.round(600 * Math.pow(1.7, level)),
		requires: { building: 'controlCenter', level: 3 },
		benefit: (level: number) => `Increases base production by ${5 * level}%`
	},
	naniteFactory: {
		name: 'Nanite Factory',
		category: 'Facilities',
		description: 'Speeds up construction and repairs using nanotechnology.',
		cost: (level: number) => ({
			metal: Math.round(1500 * Math.pow(2, level)),
			crystal: Math.round(1200 * Math.pow(2, level))
		}),
		time: (level: number) => Math.round(900 * Math.pow(1.8, level)),
		requires: { building: 'shipyard', level: 2 },
		benefit: (level: number) => `Reduces build times by ${Math.min(50, 5 * level)}%`
	},
	fusionReactor: {
		name: 'Fusion Reactor',
		category: 'Resources',
		description: 'Provides large amounts of energy to power advanced systems.',
		cost: (level: number) => ({
			metal: Math.round(800 * Math.pow(1.8, level)),
			crystal: Math.round(600 * Math.pow(1.8, level)),
			deuterium: Math.round(200 * Math.pow(1.6, level))
		}),
		time: (level: number) => Math.round(700 * Math.pow(1.7, level)),
		benefit: (level: number) => `Increases energy cap and improves efficiency.`
	},
	missileSilo: {
		name: 'Missile Silo',
		category: 'Defense',
		description: 'Houses defensive missiles to protect your colonies.',
		cost: (level: number) => ({
			metal: Math.round(500 * Math.pow(1.6, level)),
			crystal: Math.round(300 * Math.pow(1.6, level))
		}),
		time: (level: number) => Math.round(400 * Math.pow(1.6, level)),
		requires: { building: 'controlCenter', level: 2 },
		benefit: (level: number) => `Adds anti-ship defensive capability.`
	},
	sensorPhalanx: {
		name: 'Sensor Phalanx',
		category: 'Defense',
		description: 'Long-range sensors that reveal fleet movements and cloaked targets.',
		cost: (level: number) => ({
			metal: Math.round(600 * Math.pow(1.7, level)),
			crystal: Math.round(600 * Math.pow(1.7, level))
		}),
		time: (level: number) => Math.round(450 * Math.pow(1.6, level)),
		requires: { research: 'laserTechnology', level: 1 },
		benefit: (level: number) => `Increases detection range and intel accuracy.`
	}
};

// Additional buildings
BUILDING_DATA.metalStorage = {
	name: 'Metal Storage',
	category: 'Resources',
	description: 'Increases your metal storage capacity.',
	cost: (level: number) => ({
		metal: Math.round(200 * Math.pow(1.7, level)),
		crystal: Math.round(80 * Math.pow(1.6, level))
	}),
	time: (level: number) => Math.round(90 * Math.pow(1.5, level)),
	benefit: (level: number) => `Storage cap +${5000 * (level + 1)}`
};
BUILDING_DATA.crystalStorage = {
	name: 'Crystal Storage',
	category: 'Resources',
	description: 'Increases your crystal storage capacity.',
	cost: (level: number) => ({
		metal: Math.round(160 * Math.pow(1.6, level)),
		crystal: Math.round(120 * Math.pow(1.7, level))
	}),
	time: (level: number) => Math.round(90 * Math.pow(1.5, level)),
	benefit: (level: number) => `Storage cap +${3000 * (level + 1)}`
};
BUILDING_DATA.fuelTank = {
	name: 'Fuel Tank',
	category: 'Resources',
	description: 'Increases fuel storage capacity for long campaigns.',
	cost: (level: number) => ({
		metal: Math.round(220 * Math.pow(1.6, level)),
		crystal: Math.round(100 * Math.pow(1.6, level))
	}),
	time: (level: number) => Math.round(100 * Math.pow(1.5, level)),
	benefit: (level: number) => `Storage cap +${2000 * (level + 1)}`
};
BUILDING_DATA.allianceHall = {
	name: 'Alliance Hall',
	category: 'Facilities',
	description: 'Hub for alliance features: chat, donations and alliance research.',
	cost: (level: number) => ({
		metal: Math.round(2000 * Math.pow(1.8, level)),
		crystal: Math.round(1200 * Math.pow(1.8, level))
	}),
	time: (level: number) => Math.round(600 * Math.pow(1.6, level)),
	requires: { building: 'controlCenter', level: 4 },
	benefit: (level: number) => `Unlocks alliance features and donation slots.`
};
BUILDING_DATA.marketplace = {
	name: 'Marketplace',
	category: 'Facilities',
	description: 'Enables player marketplace and trading routes.',
	cost: (level: number) => ({
		metal: Math.round(1500 * Math.pow(1.7, level)),
		crystal: Math.round(900 * Math.pow(1.7, level))
	}),
	time: (level: number) => Math.round(420 * Math.pow(1.5, level)),
	requires: { building: 'controlCenter', level: 2 },
	benefit: (level: number) => `Unlocks market orders and trading.`
};
BUILDING_DATA.defenseTower = {
	name: 'Defense Tower',
	category: 'Defense',
	description: 'Small orbital defense that attacks enemy ships entering orbit.',
	cost: (level: number) => ({
		metal: Math.round(800 * Math.pow(1.6, level)),
		crystal: Math.round(400 * Math.pow(1.6, level))
	}),
	time: (level: number) => Math.round(300 * Math.pow(1.5, level)),
	benefit: (level: number) => `Adds local anti-ship firepower.`
};
BUILDING_DATA.shieldGenerator = {
	name: 'Shield Generator',
	category: 'Defense',
	description: 'Generates a temporary protective shield around the colony.',
	cost: (level: number) => ({
		metal: Math.round(5000 * Math.pow(1.9, level)),
		crystal: Math.round(3000 * Math.pow(1.9, level)),
		deuterium: Math.round(800 * Math.pow(1.6, level))
	}),
	time: (level: number) => Math.round(1200 * Math.pow(1.7, level)),
	requires: { research: 'shieldTech', level: 1 },
	benefit: (level: number) => `Provides a damage-absorbing shield for a short duration.`
};
BUILDING_DATA.orbitalDock = {
	name: 'Orbital Dock',
	category: 'Facilities',
	description: 'Allows large capital ships to dock for repairs and refit.',
	cost: (level: number) => ({
		metal: Math.round(8000 * Math.pow(1.8, level)),
		crystal: Math.round(5000 * Math.pow(1.8, level))
	}),
	time: (level: number) => Math.round(2400 * Math.pow(1.6, level)),
	requires: { building: 'shipyard', level: 4 },
	benefit: (level: number) => `Enables capital ship repairs and hangar operations.`
};
BUILDING_DATA.habitat = {
	name: 'Habitat Module',
	category: 'Resources',
	description: 'Increases population and workforce to improve production.',
	cost: (level: number) => ({
		metal: Math.round(300 * Math.pow(1.6, level)),
		crystal: Math.round(150 * Math.pow(1.6, level))
	}),
	time: (level: number) => Math.round(120 * Math.pow(1.5, level)),
	benefit: (level: number) => `Population +${100 * (level + 1)}`
};
BUILDING_DATA.academy = {
	name: 'Academy',
	category: 'Facilities',
	description: 'Advanced training facility that reduces officer training and research times.',
	cost: (level: number) => ({
		metal: Math.round(2200 * Math.pow(1.7, level)),
		crystal: Math.round(1800 * Math.pow(1.7, level))
	}),
	time: (level: number) => Math.round(900 * Math.pow(1.6, level)),
	requires: { building: 'researchLab', level: 3 },
	benefit: (level: number) => `Reduces officer training and research times.`
};
BUILDING_DATA.radarArray = {
	name: 'Radar Array',
	category: 'Defense',
	description: 'Planetary radar increases sensor coverage and reduces stealth effectiveness.',
	cost: (level: number) => ({
		metal: Math.round(900 * Math.pow(1.6, level)),
		crystal: Math.round(900 * Math.pow(1.6, level))
	}),
	time: (level: number) => Math.round(480 * Math.pow(1.5, level)),
	benefit: (level: number) => `Improves detection range.`
};
BUILDING_DATA.planetaryFactory = {
	name: 'Planetary Factory',
	category: 'Resources',
	description: 'Large industrial complex that converts resources into advanced components.',
	cost: (level: number) => ({
		metal: Math.round(5000 * Math.pow(1.8, level)),
		crystal: Math.round(3000 * Math.pow(1.8, level))
	}),
	time: (level: number) => Math.round(1800 * Math.pow(1.7, level)),
	requires: { building: 'metalMine', level: 5 },
	benefit: (level: number) => `Increases component output and unlocks advanced items.`
};

// Research technologies that can be unlocked in the Research Lab
export const RESEARCH_DATA = {
	laserTechnology: {
		name: 'Laser Technology',
		description: 'Improves beam weapons and sensor fidelity.',
		cost: (level: number) => ({
			crystal: Math.round(800 * Math.pow(1.7, level)),
			metal: Math.round(400 * Math.pow(1.6, level))
		}),
		time: (level: number) => Math.round(600 * Math.pow(1.6, level)),
		effect: (level: number) => `+${5 * level}% beam weapon efficiency`
	},
	plasmaWeapons: {
		name: 'Plasma Weapons',
		description: 'High-energy weapons effective against shields and armor.',
		cost: (level: number) => ({
			crystal: Math.round(2000 * Math.pow(1.8, level)),
			deuterium: Math.round(800 * Math.pow(1.6, level))
		}),
		time: (level: number) => Math.round(1800 * Math.pow(1.7, level)),
		effect: (level: number) => `+${8 * level}% plasma damage`
	},
	armorPlating: {
		name: 'Armor Plating',
		description: 'Improves hull strength for all ship classes.',
		cost: (level: number) => ({
			metal: Math.round(1500 * Math.pow(1.7, level)),
			crystal: Math.round(600 * Math.pow(1.6, level))
		}),
		time: (level: number) => Math.round(1200 * Math.pow(1.6, level)),
		effect: (level: number) => `+${6 * level}% hull HP`
	},
	propulsion: {
		name: 'Advanced Propulsion',
		description: 'Improves ship engines to increase speed and maneuverability.',
		cost: (level: number) => ({
			metal: Math.round(1200 * Math.pow(1.6, level)),
			crystal: Math.round(800 * Math.pow(1.6, level))
		}),
		time: (level: number) => Math.round(900 * Math.pow(1.5, level)),
		effect: (level: number) => `+${5 * level}% ship speed`
	},
	cargoOptimization: {
		name: 'Cargo Optimization',
		description: 'Reduces cargo consumption and increases capacity efficiency.',
		cost: (level: number) => ({
			metal: Math.round(600 * Math.pow(1.5, level)),
			crystal: Math.round(400 * Math.pow(1.5, level))
		}),
		time: (level: number) => Math.round(600 * Math.pow(1.5, level)),
		effect: (level: number) => `+${10 * level}% cargo`
	},
	advancedSensors: {
		name: 'Advanced Sensors',
		description: 'Significantly improves detection ranges and accuracy.',
		cost: (level: number) => ({
			crystal: Math.round(1200 * Math.pow(1.7, level)),
			metal: Math.round(600 * Math.pow(1.6, level))
		}),
		time: (level: number) => Math.round(1000 * Math.pow(1.6, level)),
		effect: (level: number) => `+${7 * level}% sensor range`
	},
	stealthTech: {
		name: 'Stealth Technology',
		description: 'Reduces detectability of small vessels and improves cloaking.',
		cost: (level: number) => ({
			crystal: Math.round(2000 * Math.pow(1.8, level)),
			metal: Math.round(800 * Math.pow(1.7, level))
		}),
		time: (level: number) => Math.round(2400 * Math.pow(1.7, level)),
		effect: (level: number) => `Reduces detectability by ${5 * level}%`
	},
	droneControl: {
		name: 'Drone Control',
		description: 'Enables advanced combat drones and drone carriers.',
		cost: (level: number) => ({
			crystal: Math.round(1000 * Math.pow(1.7, level)),
			metal: Math.round(600 * Math.pow(1.6, level))
		}),
		time: (level: number) => Math.round(1200 * Math.pow(1.6, level)),
		effect: (level: number) => `Unlocks drone control and +${5 * level}% drone effectiveness`
	},
	carrierDoctrine: {
		name: 'Carrier Doctrine',
		description: 'Improves carrier and fighter coordination for increased strike power.',
		cost: (level: number) => ({
			crystal: Math.round(1600 * Math.pow(1.7, level)),
			metal: Math.round(900 * Math.pow(1.6, level))
		}),
		time: (level: number) => Math.round(1800 * Math.pow(1.6, level)),
		effect: (level: number) => `+${6 * level}% carrier strike power`
	},
	automationProtocols: {
		name: 'Automation Protocols',
		description: 'Enables server-side automation for construction queues and simple macros.',
		cost: (level: number) => ({
			crystal: Math.round(500 * Math.pow(1.5, level)),
			metal: Math.round(300 * Math.pow(1.5, level))
		}),
		time: (level: number) => Math.round(800 * Math.pow(1.5, level)),
		effect: (level: number) => `Unlocks automation features`
	}
};

export const CHIP_DATA = {
	attackChip: {
		name: 'Attack Chip',
		description: 'Increases ship attack by 10% per level.',
		cost: (level: number) => ({
			crystal: Math.round(500 * Math.pow(1.7, level)),
			deuterium: Math.round(200 * Math.pow(1.6, level))
		}),
		time: (level: number) => Math.round(300 * Math.pow(1.6, level)),
		effect: (level: number) => `+${10 * level}% attack`
	},
	defenseChip: {
		name: 'Defense Chip',
		description: 'Increases ship defense by 10% per level.',
		cost: (level: number) => ({
			metal: Math.round(400 * Math.pow(1.7, level)),
			crystal: Math.round(400 * Math.pow(1.7, level))
		}),
		time: (level: number) => Math.round(300 * Math.pow(1.6, level)),
		effect: (level: number) => `+${10 * level}% defense`
	},
	speedChip: {
		name: 'Speed Chip',
		description: 'Improves ship travel speed (reduces travel time).',
		cost: (level: number) => ({
			crystal: Math.round(600 * Math.pow(1.6, level)),
			deuterium: Math.round(300 * Math.pow(1.5, level))
		}),
		time: (level: number) => Math.round(400 * Math.pow(1.5, level)),
		effect: (level: number) => `-${5 * level}% travel time`
	},
	cargoChip: {
		name: 'Cargo Chip',
		description: 'Increases cargo hold efficiency for fleets.',
		cost: (level: number) => ({
			metal: Math.round(300 * Math.pow(1.5, level)),
			crystal: Math.round(500 * Math.pow(1.5, level))
		}),
		time: (level: number) => Math.round(350 * Math.pow(1.5, level)),
		effect: (level: number) => `+${10 * level}% cargo`
	}
};

export const SYSTEMS_DATA: Record<string, { name: string; description?: string }> = {
	trade: {
		name: 'Trade System',
		description: 'Enables resource trading, market orders, and price discovery.'
	},
	espionage: {
		name: 'Espionage',
		description: 'Spy on other players, steal limited intel and sabotage operations.'
	},
	diplomacy: {
		name: 'Diplomacy',
		description: 'Formalize alliances, treaties and war declarations.'
	},
	automation: {
		name: 'Automation',
		description: 'Enable automation scripts: auto-build, auto-research and simple macros.'
	}
};

export const SHIP_TEMPLATES: ShipTemplate[] = [
	{
		shipId: 'scout',
		name: 'Scout',
		role: 'recon',
		hp: 50,
		attack: 8,
		defense: 3,
		speed: 180,
		capacity: 10,
		buildCost: { metal: 50, crystal: 10, fuel: 5, credits: 100 },
		buildTime: 10
	},
	{
		shipId: 'fighter',
		name: 'Fighter',
		role: 'fighter',
		hp: 120,
		attack: 40,
		defense: 12,
		speed: 120,
		capacity: 5,
		buildCost: { metal: 200, crystal: 50, fuel: 20, credits: 400 },
		buildTime: 45
	},
	{
		shipId: 'cruiser',
		name: 'Cruiser',
		role: 'cruiser',
		hp: 800,
		attack: 220,
		defense: 80,
		speed: 60,
		capacity: 80,
		buildCost: { metal: 3000, crystal: 1200, fuel: 800, credits: 5000 },
		buildTime: 3600
	},
	{
		shipId: 'battleship',
		name: 'Battleship',
		role: 'capital',
		hp: 5000,
		attack: 1800,
		defense: 700,
		speed: 30,
		capacity: 300,
		buildCost: { metal: 25000, crystal: 12000, fuel: 6000, credits: 50000 },
		buildTime: 86400
	},
	{
		shipId: 'carrier',
		name: 'Carrier',
		role: 'carrier',
		hp: 2200,
		attack: 300,
		defense: 400,
		speed: 40,
		capacity: 1500,
		hangarSlots: 8,
		buildCost: { metal: 12000, crystal: 8000, fuel: 4000, credits: 20000 },
		buildTime: 43200
	},
	{
		shipId: 'transport',
		name: 'Transport',
		role: 'transport',
		hp: 400,
		attack: 10,
		defense: 30,
		speed: 50,
		capacity: 2000,
		buildCost: { metal: 5000, crystal: 2000, fuel: 1000, credits: 8000 },
		buildTime: 7200
	},
	{
		shipId: 'spyProbe',
		name: 'Spy Probe',
		role: 'espionage',
		hp: 20,
		attack: 0,
		defense: 1,
		speed: 1000,
		capacity: 1,
		buildCost: { metal: 1000, crystal: 500, fuel: 500, credits: 1000 },
		buildTime: 60
	}
];

// Additional templates
SHIP_TEMPLATES.push(
	{
		shipId: 'corvette',
		name: 'Corvette',
		role: 'corvette',
		hp: 300,
		attack: 90,
		defense: 40,
		speed: 100,
		capacity: 20,
		buildCost: { metal: 800, crystal: 300, fuel: 150, credits: 1200 },
		buildTime: 600
	},
	{
		shipId: 'frigate',
		name: 'Frigate',
		role: 'frigate',
		hp: 450,
		attack: 140,
		defense: 60,
		speed: 90,
		capacity: 40,
		buildCost: { metal: 1500, crystal: 600, fuel: 300, credits: 3000 },
		buildTime: 1200
	},
	{
		shipId: 'destroyer',
		name: 'Destroyer',
		role: 'destroyer',
		hp: 1200,
		attack: 480,
		defense: 180,
		speed: 70,
		capacity: 60,
		buildCost: { metal: 6000, crystal: 2500, fuel: 1200, credits: 12000 },
		buildTime: 7200
	},
	{
		shipId: 'bomber',
		name: 'Bomber',
		role: 'bomber',
		hp: 200,
		attack: 500,
		defense: 50,
		speed: 80,
		capacity: 10,
		buildCost: { metal: 2000, crystal: 1000, fuel: 500, credits: 4000 },
		buildTime: 1800
	},
	{
		shipId: 'torpedoBoat',
		name: 'Torpedo Boat',
		role: 'torpedo',
		hp: 220,
		attack: 650,
		defense: 40,
		speed: 85,
		capacity: 5,
		buildCost: { metal: 3000, crystal: 1500, fuel: 600, credits: 6000 },
		buildTime: 2400
	},
	{
		shipId: 'supportRepair',
		name: 'Support Repair',
		role: 'support',
		hp: 600,
		attack: 30,
		defense: 120,
		speed: 70,
		capacity: 100,
		repairRate: 50,
		buildCost: { metal: 4000, crystal: 2000, fuel: 800, credits: 8000 },
		buildTime: 3600
	},
	{
		shipId: 'stealth',
		name: 'Stealth Vessel',
		role: 'stealth',
		hp: 150,
		attack: 60,
		defense: 20,
		speed: 200,
		capacity: 5,
		cloak: true,
		buildCost: { metal: 800, crystal: 1200, fuel: 200, credits: 6000 },
		buildTime: 2400
	},
	{
		shipId: 'miningVessel',
		name: 'Mining Vessel',
		role: 'mining',
		hp: 300,
		attack: 20,
		defense: 50,
		speed: 60,
		capacity: 500,
		miningRate: 100,
		buildCost: { metal: 2000, crystal: 800, fuel: 300, credits: 3000 },
		buildTime: 3600
	},
	{
		shipId: 'interceptor',
		name: 'Interceptor',
		role: 'interceptor',
		hp: 160,
		attack: 120,
		defense: 25,
		speed: 260,
		capacity: 8,
		buildCost: { metal: 600, crystal: 300, fuel: 80, credits: 900 },
		buildTime: 400
	},
	{
		shipId: 'battlecruiser',
		name: 'Battlecruiser',
		role: 'battlecruiser',
		hp: 2800,
		attack: 1000,
		defense: 420,
		speed: 45,
		capacity: 220,
		buildCost: { metal: 15000, crystal: 8000, fuel: 3000, credits: 30000 },
		buildTime: 64800
	},
	{
		shipId: 'dreadnought',
		name: 'Dreadnought',
		role: 'dreadnought',
		hp: 12000,
		attack: 6000,
		defense: 2500,
		speed: 18,
		capacity: 1000,
		buildCost: { metal: 120000, crystal: 60000, fuel: 30000, credits: 200000 },
		buildTime: 604800
	},
	{
		shipId: 'drone',
		name: 'Combat Drone',
		role: 'drone',
		hp: 30,
		attack: 25,
		defense: 5,
		speed: 220,
		capacity: 0,
		buildCost: { metal: 20, crystal: 10, fuel: 2, credits: 20 },
		buildTime: 5
	},
	{
		shipId: 'droneCarrier',
		name: 'Drone Carrier',
		role: 'droneCarrier',
		hp: 1400,
		attack: 200,
		defense: 300,
		speed: 50,
		capacity: 200,
		droneCapacity: 40,
		buildCost: { metal: 18000, crystal: 12000, fuel: 5000, credits: 40000 },
		buildTime: 86400
	},
	{
		shipId: 'electronicWarfare',
		name: 'EW Frigate',
		role: 'ew',
		hp: 400,
		attack: 10,
		defense: 60,
		speed: 85,
		capacity: 30,
		ewRating: 80,
		buildCost: { metal: 2500, crystal: 1500, fuel: 400, credits: 5000 },
		buildTime: 2400
	},
	{
		shipId: 'pointDefense',
		name: 'Point Defense',
		role: 'defense',
		hp: 900,
		attack: 80,
		defense: 300,
		speed: 20,
		capacity: 0,
		pointDefense: true,
		buildCost: { metal: 5000, crystal: 2400, fuel: 600, credits: 10000 },
		buildTime: 7200
	},
	{
		shipId: 'missileCruiser',
		name: 'Missile Cruiser',
		role: 'missile',
		hp: 1600,
		attack: 1200,
		defense: 250,
		speed: 55,
		capacity: 120,
		missileSlots: 6,
		buildCost: { metal: 12000, crystal: 7000, fuel: 2500, credits: 20000 },
		buildTime: 43200
	},
	{
		shipId: 'sentinel',
		name: 'Sentinel',
		role: 'sentinel',
		hp: 2000,
		attack: 300,
		defense: 800,
		speed: 15,
		capacity: 0,
		buildCost: { metal: 20000, crystal: 10000, fuel: 4000, credits: 40000 },
		buildTime: 86400
	},
	{
		shipId: 'siegeEngine',
		name: 'Siege Engine',
		role: 'siege',
		hp: 3500,
		attack: 2200,
		defense: 300,
		speed: 25,
		capacity: 50,
		structureDamage: 2000,
		buildCost: { metal: 40000, crystal: 20000, fuel: 10000, credits: 80000 },
		buildTime: 172800
	},
	{
		shipId: 'heavyTransport',
		name: 'Heavy Transport',
		role: 'transport_heavy',
		hp: 800,
		attack: 20,
		defense: 100,
		speed: 35,
		capacity: 8000,
		buildCost: { metal: 20000, crystal: 8000, fuel: 3000, credits: 25000 },
		buildTime: 28800
	},
	{
		shipId: 'commando',
		name: 'Commando',
		role: 'boarding',
		hp: 120,
		attack: 60,
		defense: 40,
		speed: 150,
		capacity: 6,
		boardingPower: 120,
		buildCost: { metal: 900, crystal: 400, fuel: 120, credits: 1500 },
		buildTime: 900
	}
);
