import type { RequestHandler } from './$types';
import { readJson, writeJson } from '$lib/server/demoStorage';

const FLEETS_FILE = 'fleets.json';

interface FleetEntry {
	id: string;
	createdAt: string;
	etaSeconds: number;
	status: string;
	[k: string]: unknown;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as unknown;
		const fleets = await readJson<FleetEntry[]>(FLEETS_FILE, []);
		const id = 'f_' + Date.now();
		function getNumberKey(obj: unknown, key: string, fallback: number) {
			if (typeof obj === 'object' && obj !== null) {
				const v = (obj as Record<string, unknown>)[key];
				if (typeof v === 'number') return v;
			}
			return fallback;
		}

		const eta = getNumberKey(body, 'etaSeconds', 60);
		const entry: FleetEntry = {
			id,
			createdAt: new Date().toISOString(),
			etaSeconds: eta,
			status: 'in_transit',
			...(body as object)
		};
		fleets.push(entry);
		await writeJson(FLEETS_FILE, fleets);
		return new Response(JSON.stringify({ fleet: entry }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch {
		return new Response(JSON.stringify({ error: 'invalid request' }), { status: 400 });
	}
};
