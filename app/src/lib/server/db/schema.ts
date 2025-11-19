import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

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
	userId: text('user_id').notNull().references(() => user.id),
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
	userId: text('user_id').primaryKey().references(() => user.id),
	level: integer('level').notNull().default(1),
	power: integer('power').notNull().default(10),
	credits: integer('credits').notNull().default(1000),
	metal: integer('metal').notNull().default(500),
	crystal: integer('crystal').notNull().default(200),
	fuel: integer('fuel').notNull().default(100)
});

export const playerShips = pgTable('player_ships', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	shipTemplateId: text('ship_template_id').notNull().references(() => shipTemplate.id),
	quantity: integer('quantity').notNull()
});

export type PlayerState = typeof playerState.$inferSelect;
export type PlayerShip = typeof playerShips.$inferSelect;

export const playerBuildings = pgTable('player_buildings', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	buildingId: text('building_id').notNull(),
	level: integer('level').notNull()
});

export const playerResearch = pgTable('player_research', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	techId: text('tech_id').notNull(),
	level: integer('level').notNull()
});

export type PlayerBuilding = typeof playerBuildings.$inferSelect;
export type PlayerResearch = typeof playerResearch.$inferSelect;

export const processedBuilds = pgTable('processed_builds', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	shipTemplateId: text('ship_template_id').notNull().references(() => shipTemplate.id),
	quantity: integer('quantity').notNull(),
	processedAt: timestamp('processed_at', { mode: 'date' }).notNull(),
	rolledBack: integer('rolled_back').notNull().default(0),
	rolledBackAt: timestamp('rolled_back_at', { mode: 'date' })
});

export const missions = pgTable('missions', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	shipTemplateId: text('ship_template_id').notNull().references(() => shipTemplate.id),
	quantity: integer('quantity').notNull(),
	startedAt: timestamp('started_at', { mode: 'date' }).notNull(),
	eta: timestamp('eta', { mode: 'date' }).notNull(),
	status: text('status').notNull().default('in_progress')
});

export const processedMissions = pgTable('processed_missions', {
	id: text('id').primaryKey(),
	missionId: text('mission_id').notNull().references(() => missions.id),
	userId: text('user_id').notNull().references(() => user.id),
	shipTemplateId: text('ship_template_id').notNull().references(() => shipTemplate.id),
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
export type ProcessedMission = typeof processedMissions.$inferSelect;
