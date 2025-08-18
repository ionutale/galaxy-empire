import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export const shipTemplate = sqliteTable('ship_template', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	role: text('role').notNull(),
	buildTime: integer('build_time').notNull(),
	costCredits: integer('cost_credits').notNull()
});

export const buildQueue = sqliteTable('build_queue', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	shipTemplateId: text('ship_template_id').notNull().references(() => shipTemplate.id),
	quantity: integer('quantity').notNull(),
	startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
	eta: integer('eta', { mode: 'timestamp' }).notNull()
});

export type ShipTemplate = typeof shipTemplate.$inferSelect;
export type BuildQueueItem = typeof buildQueue.$inferSelect;
