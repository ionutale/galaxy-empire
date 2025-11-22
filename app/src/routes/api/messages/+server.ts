import type { RequestHandler } from '@sveltejs/kit';
import { validateSessionToken } from '$lib/server/auth';
import { sessionCookieName } from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc, and, or, gt } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
  const token = event.cookies.get(sessionCookieName);
  if (!token) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const { user } = await validateSessionToken(token);
  if (!user) return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 });

  const partnerId = event.url.searchParams.get('partnerId');
  const after = event.url.searchParams.get('after');

  try {
    if (partnerId) {
      // Fetch conversation with specific user
      const conditions = [
        or(
          and(eq(table.privateMessages.senderId, user.id), eq(table.privateMessages.receiverId, partnerId)),
          and(eq(table.privateMessages.senderId, partnerId), eq(table.privateMessages.receiverId, user.id))
        )
      ];
      if (after) {
        conditions.push(gt(table.privateMessages.timestamp, new Date(after)));
      }

      const messages = await db
        .select()
        .from(table.privateMessages)
        .where(and(...conditions))
        .orderBy(desc(table.privateMessages.timestamp))
        .limit(50);

      return new Response(JSON.stringify(messages.reverse()), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    } else {
      // Fetch list of conversations (recent contacts)
      // This is complex in SQL, for simplicity we fetch all recent messages involving user and unique by partner
      const recent = await db
        .select({
          id: table.privateMessages.id,
          senderId: table.privateMessages.senderId,
          receiverId: table.privateMessages.receiverId,
          content: table.privateMessages.content,
          timestamp: table.privateMessages.timestamp,
          read: table.privateMessages.read,
          senderName: table.user.username // Join to get name? Need alias or separate query
        })
        .from(table.privateMessages)
        .innerJoin(table.user, eq(table.privateMessages.senderId, table.user.id))
        .where(or(eq(table.privateMessages.senderId, user.id), eq(table.privateMessages.receiverId, user.id)))
        .orderBy(desc(table.privateMessages.timestamp))
        .limit(100);

      // Client side grouping for simplicity
      return new Response(JSON.stringify(recent), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
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
  const { receiverId, content } = body;

  if (!content || !receiverId) return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400 });

  try {
    await db.insert(table.privateMessages).values({
      id: crypto.randomUUID(),
      senderId: user.id,
      receiverId,
      content,
      read: 0
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    console.error('Failed to send message', e);
    return new Response(JSON.stringify({ error: 'internal_server_error' }), { status: 500 });
  }
};
