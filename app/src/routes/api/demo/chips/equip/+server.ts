import type { RequestHandler } from './$types';
import { readJson, writeJson } from '$lib/server/demoStorage';

const PLAYER_FILE = 'player.json';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { chipId, equip } = await request.json();
		if (!chipId) return new Response(JSON.stringify({ error: 'missing chipId' }), { status: 400 });
		const state = await readJson<PlayerState>(PLAYER_FILE, DEFAULT_STATE);
		const equipped = state.equippedChips || {};
		equipped[chipId] = !!equip;
		const merged = { ...state, equippedChips: equipped };
		await writeJson<PlayerState>(PLAYER_FILE, merged);
		return new Response(JSON.stringify({ state: merged }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
	}
};

type PlayerState = {
	chips?: Record<string, number>;
	equippedChips?: Record<string, boolean>;
	buildings?: Record<string, number>;
	research?: Record<string, unknown>;
	resources?: Record<string, number>;
	[k: string]: unknown;
};

const DEFAULT_STATE: PlayerState = {};
