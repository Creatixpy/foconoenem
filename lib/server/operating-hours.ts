'use server';

import { getBrazilNow } from '@/lib/server/brazil-time';
import { calculateOperatingHours, type OperatingHoursInfo } from '@/lib/contracts/operating-hours';

export async function getOperatingHoursInfo(): Promise<OperatingHoursInfo> {
  const { now, usedFallback } = await getBrazilNow();
  return calculateOperatingHours(now, usedFallback);
}
