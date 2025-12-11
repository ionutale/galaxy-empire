import { vi } from 'vitest';

// Mock the database connection to avoid requiring DATABASE_URL
vi.mock('$lib/server/db', () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => [])
			}))
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn(() => Promise.resolve())
			}))
		})),
		insert: vi.fn(() => ({
			values: vi.fn(() => Promise.resolve())
		}))
	}
}));

// Mock the auth functions
vi.mock('$lib/server/auth', () => ({
	validateSessionToken: vi.fn(() => Promise.resolve({ user: null })),
	sessionCookieName: 'session'
}));

// Mock the game data
vi.mock('$lib/data/gameData', () => ({
	BUILDING_DATA: {
		testBuilding: {
			cost: () => ({ credits: 100 }),
			time: 10
		}
	}
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
	value: {
		randomUUID: () => 'test-uuid'
	}
});
