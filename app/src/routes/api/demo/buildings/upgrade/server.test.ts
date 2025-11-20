import { describe, it, expect } from 'vitest';
import { POST } from './+server';

describe('POST /api/demo/buildings/upgrade', () => {
	it('returns 401 when unauthenticated', async () => {
		const result = await POST({
			request: new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) }),
			cookies: { get: () => undefined }
		} as any);
		expect(result).toBeInstanceOf(Response);
		const body = await result!.text();
		expect((result as Response).status).toBe(401);
		expect(body).toContain('unauthenticated');
	});
});
