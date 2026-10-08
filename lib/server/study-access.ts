import 'server-only';

import type { OperatingHoursInfo } from '@/lib/contracts/operating-hours';
import { getUserAiRuntime, type UserAiRuntime } from '@/lib/server/ai/provider';
import { getOperatingHoursInfo } from '@/lib/server/operating-hours';

export class StudyAccessError extends Error {
  constructor(public readonly operatingInfo: OperatingHoursInfo) {
    super(operatingInfo.message);
    this.name = 'StudyAccessError';
  }
}

/**
 * Authorizes new study work using the database-backed subscription. Canonical
 * essay/quiz replays call this only when their service actually needs a runtime.
 */
export async function getStudyAiRuntime(userId: string): Promise<UserAiRuntime> {
  const [runtime, operatingInfo] = await Promise.all([
    getUserAiRuntime(userId),
    getOperatingHoursInfo(),
  ]);

  if (!runtime.subscription.hasMaxAccess && !operatingInfo.isOpen) {
    throw new StudyAccessError(operatingInfo);
  }

  return runtime;
}
