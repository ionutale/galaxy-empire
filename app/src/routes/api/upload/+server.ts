import type { RequestHandler } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth';
import { sessionCookieName } from '$lib/server/auth';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export const POST: RequestHandler = async (event) => {
  const token = event.cookies.get(sessionCookieName);
  if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const { user } = await validateSessionToken(token);
  if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  try {
    const data = await event.request.formData();
    const file = data.get('file') as File;

    if (!file) return new Response(JSON.stringify({ error: 'no_file' }), { status: 400 });

    const buffer = await file.arrayBuffer();
    const fileName = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'static', 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    writeFileSync(join(uploadDir, fileName), Buffer.from(buffer));

    return new Response(JSON.stringify({ url: `/uploads/${fileName}` }), { status: 200 });
  } catch (e) {
    console.error('Failed to upload file', e);
    return new Response(JSON.stringify({ error: 'internal_server_error' }), { status: 500 });
  }
};
