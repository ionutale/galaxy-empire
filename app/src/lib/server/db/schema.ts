import { pgTable, serial, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { mode: 'date' }).notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export const shipTemplate = pgTable('ship_template', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	role: text('role').notNull(),
	buildTime: integer('build_time').notNull(),
	costCredits: integer('cost_credits').notNull()
});

export const buildQueue = pgTable('build_queue', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	type: text('type').notNull().default('ship'),
	shipTemplateId: text('ship_template_id').references(() => shipTemplate.id),
	buildingId: text('building_id'),
	techId: text('tech_id'),
	quantity: integer('quantity').notNull().default(1),
	startedAt: timestamp('started_at', { mode: 'date' }).notNull(),
	eta: timestamp('eta', { mode: 'date' }).notNull(),
	totalDuration: integer('total_duration').notNull().default(0)
});

export type ShipTemplate = typeof shipTemplate.$inferSelect;
export type BuildQueueItem = typeof buildQueue.$inferSelect;

export const playerState = pgTable('player_state', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id),
	level: integer('level').notNull().default(1),
	power: integer('power').notNull().default(10),
	credits: integer('credits').notNull().default(1000),
	metal: integer('metal').notNull().default(500),
	crystal: integer('crystal').notNull().default(200),
	fuel: integer('fuel').notNull().default(100),
	tutorialStep: integer('tutorial_step').notNull().default(0)
});

export const playerShips = pgTable('player_ships', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	shipTemplateId: text('ship_template_id')
		.notNull()
		.references(() => shipTemplate.id),
	quantity: integer('quantity').notNull()
});

export type PlayerState = typeof playerState.$inferSelect;
export type PlayerShip = typeof playerShips.$inferSelect;

export const playerBuildings = pgTable('player_buildings', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	buildingId: text('building_id').notNull(),
	planetId: text('planet_id').references(() => planets.id), // Nullable for backward compatibility or global buildings? Better make it specific.
	level: integer('level').notNull()
});

export const playerResearch = pgTable('player_research', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	techId: text('tech_id').notNull(),
	level: integer('level').notNull()
});

export type PlayerBuilding = typeof playerBuildings.$inferSelect;
export type PlayerResearch = typeof playerResearch.$inferSelect;

export const processedBuilds = pgTable('processed_builds', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	type: text('type').notNull().default('ship'),
	shipTemplateId: text('ship_template_id').references(() => shipTemplate.id),
	buildingId: text('building_id'),
	techId: text('tech_id'),
	quantity: integer('quantity').notNull(),
	processedAt: timestamp('processed_at', { mode: 'date' }).notNull(),
	level: integer('level'),
	rolledBack: integer('rolled_back').notNull().default(0),
	rolledBackAt: timestamp('rolled_back_at', { mode: 'date' })
});

export const fleets = pgTable('fleets', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	originSystem: integer('origin_system').default(1),
	originPlanet: integer('origin_planet').default(1),
	targetSystem: integer('target_system').notNull(),
	targetPlanet: integer('target_planet').notNull(),
	mission: text('mission').notNull(), // 'transport', 'attack', 'spy', 'colonize', 'recycle'
	status: text('status').notNull().default('active'), // 'active', 'returning', 'completed'
	startTime: timestamp('start_time', { mode: 'date' }).notNull().defaultNow(),
	arrivalTime: timestamp('arrival_time', { mode: 'date' }).notNull(),
	returnTime: timestamp('return_time', { mode: 'date' }),
	composition: jsonb('composition').notNull().$type<Record<string, number>>(),
	cargo: jsonb('cargo').notNull().default({}).$type<Record<string, number>>()
});

export type Fleet = typeof fleets.$inferSelect;

// Deprecated: missions table (replaced by fleets)
export const missions = pgTable('missions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	shipTemplateId: text('ship_template_id')
		.notNull()
		.references(() => shipTemplate.id),
	quantity: integer('quantity').notNull(),
	startedAt: timestamp('started_at', { mode: 'date' }).notNull(),
	eta: timestamp('eta', { mode: 'date' }).notNull(),
	status: text('status').notNull().default('in_progress')
});

export const processedMissions = pgTable('processed_missions', {
	id: text('id').primaryKey(),
	missionId: text('mission_id')
		.notNull()
		.references(() => missions.id),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	shipTemplateId: text('ship_template_id')
		.notNull()
		.references(() => shipTemplate.id),
	quantity: integer('quantity').notNull(),
	quantityLost: integer('quantity_lost').notNull().default(0),
	outcome: text('outcome').notNull(),
	rewardCredits: integer('reward_credits').notNull().default(0),
	rewardMetal: integer('reward_metal').notNull().default(0),
	rewardCrystal: integer('reward_crystal').notNull().default(0),
	completedAt: timestamp('completed_at', { mode: 'date' }).notNull(),
	rolledBack: integer('rolled_back').notNull().default(0),
	rolledBackAt: timestamp('rolled_back_at', { mode: 'date' })
});

export type ProcessedBuild = typeof processedBuilds.$inferSelect;
export type Mission = typeof missions.$inferSelect;
export const systems = pgTable('systems', {
	id: integer('id').primaryKey(),
	x: integer('x').notNull(),
	y: integer('y').notNull(),
	name: text('name').notNull()
});

export const planets = pgTable('planets', {
	id: text('id').primaryKey(),
	systemId: integer('system_id')
		.notNull()
		.references(() => systems.id),
	orbitIndex: integer('orbit_index').notNull(),
	name: text('name').notNull(),
	type: text('type').notNull(), // 'terrestrial', 'gas_giant', 'ice', 'lava', 'ocean'
	ownerId: text('owner_id').references(() => user.id),
	resources: jsonb('resources').$type<{ metal: number; crystal: number; fuel: number }>()
});

export type System = typeof systems.$inferSelect;
export const combatReports = pgTable('combat_reports', {
	id: text('id').primaryKey(),
	attackerId: text('attacker_id')
		.notNull()
		.references(() => user.id),
	defenderId: text('defender_id').references(() => user.id), // Nullable for PvE or abandoned planets
	timestamp: timestamp('timestamp', { mode: 'date' }).notNull(),
	outcome: text('outcome').notNull(), // 'attacker_win', 'defender_win', 'draw'
	log: jsonb('log').notNull().$type<any[]>(), // Detailed combat log
	loot: jsonb('loot').$type<{ metal: number; crystal: number; fuel: number }>()
});

export type CombatReport = typeof combatReports.$inferSelect;

export const userPoints = pgTable('user_points', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id),
	total: integer('total').notNull().default(0),
	mines: integer('mines').notNull().default(0),
	fleets: integer('fleets').notNull().default(0),
	defense: integer('defense').notNull().default(0),
	ranking: integer('ranking').notNull().default(0)
});

export type UserPoints = typeof userPoints.$inferSelect;

export const chatMessages = pgTable('chat_messages', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	channel: text('channel').notNull().default('global'), // 'global', 'alliance:ID'
	content: text('content').notNull(),
	type: text('type').notNull().default('text'), // 'text', 'image', 'report'
	timestamp: timestamp('timestamp', { mode: 'date' }).notNull().defaultNow()
});

export type ChatMessage = typeof chatMessages.$inferSelect;

export const privateMessages = pgTable('private_messages', {
	id: text('id').primaryKey(),
	senderId: text('sender_id')
		.notNull()
		.references(() => user.id),
	receiverId: text('receiver_id')
		.notNull()
		.references(() => user.id),
	content: text('content').notNull(),
	read: integer('read').notNull().default(0), // 0 = unread, 1 = read
	timestamp: timestamp('timestamp', { mode: 'date' }).notNull().defaultNow()
});

export type PrivateMessage = typeof privateMessages.$inferSelect;

export const espionageReports = pgTable('espionage_reports', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id), // The user who initiated the spy mission
	targetId: text('target_id').references(() => user.id), // The user being spied on (optional if unowned)
	targetSystem: integer('target_system').notNull(),
	targetPlanet: integer('target_planet').notNull(),
	timestamp: timestamp('timestamp', { mode: 'date' }).notNull(),
	level: integer('level').notNull(), // 0=failed, 1=resources, 2=fleet, 3=defense, 4=buildings, 5=tech
	content: jsonb('content').notNull().$type<any>() // The actual data revealed
});

export type EspionageReport = typeof espionageReports.$inferSelect;
