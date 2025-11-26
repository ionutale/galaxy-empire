import { json } from '@sveltejs/kit';
import { claimTutorialReward } from '$lib/server/tutorial';
import { user } from '$lib/server/db/schema';

export async function POST({ locals }) {
  const { user } = locals;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await claimTutorialReward(user.id);
    return json(result);
  } catch (e: any) {
    console.error('Tutorial claim error:', e);
    return json({ error: e.message || 'Failed to claim reward' }, { status: 400 });
  }
}
