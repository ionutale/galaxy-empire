import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { SHIP_TEMPLATES } from '$lib/data/gameData';

type ShipTemplateRow = {
	id: string;
	name: string;
	role: string;
	buildTime: number;
	costCredits: number;
	costMetal: number;
	costCrystal: number;
	costFuel: number;
};

export const GET: RequestHandler = async () => {
	// We will return the raw SHIP_TEMPLATES from gameData to ensure we have all fields
	// The DB cache logic below is fine but might be missing columns for other resources
	// For now, let's just return the full data from the source of truth

	const templates = SHIP_TEMPLATES.map((s) => ({
		id: s.shipId,
		name: s.name,
		role: s.role,
		buildTime: s.buildTime || 0,
		costCredits: s.buildCost?.credits || 0,
		costMetal: s.buildCost?.metal || 0,
		costCrystal: s.buildCost?.crystal || 0,
		costFuel: s.buildCost?.fuel || 0
	}));

	return new Response(JSON.stringify({ templates }), {
		headers: { 'content-type': 'application/json' }
	});
};
