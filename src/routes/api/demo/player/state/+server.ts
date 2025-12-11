import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const state = {
		playerId: 'demo_player',
		displayName: 'DemoPilot',
		level: 9,
		power: 9823,
		resources: {
			credits: 1318,
			metal: 8650,
			crystal: 4300000,
			fuel: 1368
		},
		vipLevel: 1,
		allianceId: null,
		ships: { scout: 24, fighter: 12 }
	};

	return new Response(JSON.stringify({ state }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};
