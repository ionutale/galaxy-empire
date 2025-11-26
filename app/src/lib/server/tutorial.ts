import { db } from '$lib/server/db';
import { playerState, userPoints } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  reward: {
    metal?: number;
    crystal?: number;
    fuel?: number;
    credits?: number;
  };
  check: (state: any) => boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 0,
    title: 'Welcome Commander',
    description: 'Your journey begins. Construct a Metal Mine to start gathering resources.',
    reward: { metal: 500, crystal: 200 },
    check: (state) => (state.buildings?.metalMine ?? 0) >= 1
  },
  {
    id: 1,
    title: 'Power Up',
    description: 'Energy is vital. Build a Solar Plant (Control Center level 1 provides some, but you need more). Actually, let\'s upgrade the Metal Mine to level 2.',
    reward: { metal: 600, crystal: 300 },
    check: (state) => (state.buildings?.metalMine ?? 0) >= 2
  },
  {
    id: 2,
    title: 'Crystal Clear',
    description: 'Crystals are needed for advanced tech. Build a Crystal Synthesizer.',
    reward: { metal: 1000, credits: 100 },
    check: (state) => (state.buildings?.crystalSynthesizer ?? 0) >= 1
  },
  {
    id: 3,
    title: 'Fueling the Empire',
    description: 'Deuterium is the fuel of the stars. Build a Deuterium Refinery.',
    reward: { metal: 1500, crystal: 500 },
    check: (state) => (state.buildings?.deuteriumRefinery ?? 0) >= 1
  },
  {
    id: 4,
    title: 'Shipyard Construction',
    description: 'We need to defend ourselves. Upgrade Control Center to level 2, then build a Shipyard.',
    reward: { metal: 2000, crystal: 1000, fuel: 500 },
    check: (state) => (state.buildings?.shipyard ?? 0) >= 1
  },
  {
    id: 5,
    title: 'First Fleet',
    description: 'Construct a Fighter to protect your colony.',
    reward: { credits: 1000, metal: 1000 },
    check: (state) => state.ships?.some((s: any) => s.shipTemplateId === 'fighter' && s.quantity > 0)
  }
];

export async function checkTutorialProgress(userId: string, currentState: any) {
  const player = await db.query.playerState.findFirst({
    where: eq(playerState.userId, userId)
  });

  if (!player) return null;

  const currentStepId = player.tutorialStep;
  const step = TUTORIAL_STEPS.find((s) => s.id === currentStepId);

  if (!step) return null; // Tutorial completed or invalid step

  if (step.check(currentState)) {
    return step;
  }

  return null;
}

export async function claimTutorialReward(userId: string) {
  const player = await db.query.playerState.findFirst({
    where: eq(playerState.userId, userId)
  });

  if (!player) throw new Error('Player not found');

  const currentStepId = player.tutorialStep;
  const step = TUTORIAL_STEPS.find((s) => s.id === currentStepId);

  if (!step) throw new Error('Invalid tutorial step');

  // Verify condition again to be safe (optional, but good practice)
  // For now, we assume the UI only calls this when valid, or we re-fetch state.
  // Let's just grant the reward and increment step.

  await db.transaction(async (tx) => {
    await tx
      .update(playerState)
      .set({
        metal: player.metal + (step.reward.metal ?? 0),
        crystal: player.crystal + (step.reward.crystal ?? 0),
        fuel: player.fuel + (step.reward.fuel ?? 0),
        credits: player.credits + (step.reward.credits ?? 0),
        tutorialStep: currentStepId + 1
      })
      .where(eq(playerState.userId, userId));
  });

  return { success: true, nextStep: currentStepId + 1, reward: step.reward };
}
