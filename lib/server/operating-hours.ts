import 'server-only';

import { getBrazilNow } from '@/lib/server/brazil-time';
import {
  calculateOperatingHours,
  type OperatingHoursAccess,
  type OperatingHoursInfo,
} from '@/lib/contracts/operating-hours';
import { getUserSubscriptionSummary } from '@/lib/server/subscriptions';

export async function getOperatingHoursInfo(access?: OperatingHoursAccess): Promise<OperatingHoursInfo> {
  const { now, usedFallback } = await getBrazilNow();
  return calculateOperatingHours(now, usedFallback, access);
}

/** Call only with the verified user ID from server authentication. */
export async function getUserOperatingHoursInfo(userId: string): Promise<OperatingHoursInfo> {
  const subscription = await getUserSubscriptionSummary(userId);
  const access = subscription.hasMaxAccess && subscription.currentPeriodEnd
    ? { userId, expiresAt: subscription.currentPeriodEnd }
    : undefined;
  return getOperatingHoursInfo(access);
}
