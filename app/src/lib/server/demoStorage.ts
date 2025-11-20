import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'app', 'data');

async function ensureDataDir() {
	try {
		await fs.mkdir(DATA_DIR, { recursive: true });
	} catch {
		// ignore
	}
}

export async function readJson<T>(filename: string, fallback: T): Promise<T> {
	await ensureDataDir();
	const file = path.join(DATA_DIR, filename);
	try {
		const raw = await fs.readFile(file, 'utf8');
		return JSON.parse(raw) as T;
	} catch {
		await writeJson(filename, fallback);
		return fallback;
	}
}

export async function writeJson<T>(filename: string, data: T) {
	await ensureDataDir();
	const file = path.join(DATA_DIR, filename);
	await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}
