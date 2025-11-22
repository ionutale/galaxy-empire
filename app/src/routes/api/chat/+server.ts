import type { RequestHandler } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth';
import { sessionCookieName } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc, and, gt } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
  const token = event.cookies.get(sessionCookieName);
  if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const { user } = await validateSessionToken(token);
  if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const channel = event.url.searchParams.get('channel') || 'global';
  const after = event.url.searchParams.get('after');

  try {
    const conditions = [eq(table.chatMessages.channel, channel)];
    if (after) {
      conditions.push(gt(table.chatMessages.timestamp, new Date(after)));
    }

    const messages = await db
      .select({
        id: table.chatMessages.id,
        userId: table.chatMessages.userId,
        username: table.user.username,
        content: table.chatMessages.content,
        type: table.chatMessages.type,
        timestamp: table.chatMessages.timestamp
      })
      .from(table.chatMessages)
      .innerJoin(table.user, eq(table.chatMessages.userId, table.user.id))
      .where(and(...conditions))
      .orderBy(desc(table.chatMessages.timestamp))
      .limit(50);

    return new Response(JSON.stringify(messages.reverse()), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch (e) {
    console.error('Failed to fetch messages', e);
    return new Response(JSON.stringify({ error: 'internal_server_error' }), { status: 500 });
  }
};

export const POST: RequestHandler = async (event) => {
  const token = event.cookies.get(sessionCookieName);
  if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const { user } = await validateSessionToken(token);
  if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const body = await event.request.json();
  const { content, channel = 'global', type = 'text' } = body;

  if (!content) return new Response(JSON.stringify({ error: 'missing_content' }), { status: 400 });

  try {
    await db.insert(table.chatMessages).values({
      id: crypto.randomUUID(),
      userId: user.id,
      channel,
      content,
      type
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    console.error('Failed to send message', e);
    return new Response(JSON.stringify({ error: 'internal_server_error' }), { status: 500 });
  }
};
