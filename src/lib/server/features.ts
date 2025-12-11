import { env } from '$env/dynamic/private';

export const FEATURE_MISSION_REWARDS =
	(env.FEATURE_MISSION_REWARDS || 'true') === 'true' ||
	(env.FEATURE_MISSION_REWARDS || '1') === '1';
export const FEATURE_NEW_COMBAT =
	(env.FEATURE_NEW_COMBAT || 'true') === 'true' || (env.FEATURE_NEW_COMBAT || '1') === '1';

export function isFeatureEnabled(name: 'MISSION_REWARDS' | 'NEW_COMBAT') {
	if (name === 'MISSION_REWARDS') return FEATURE_MISSION_REWARDS;
	if (name === 'NEW_COMBAT') return FEATURE_NEW_COMBAT;
	return false;
}
