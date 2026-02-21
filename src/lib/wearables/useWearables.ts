import { useState } from 'react';
import type { WearableStatus } from './types';
import { getWearableStatus } from './wearablesService';

export function useWearables(userId: string | undefined) {
  const [status] = useState<WearableStatus>(() =>
    userId ? getWearableStatus(userId) : { provider: 'none' as const, connected: false, lastSyncAt: null }
  );

  return {
    status,
    isConnected: status.connected,
    provider: status.provider,
  };
}
