'use client';

import { useEffect } from 'react';
import { clearAllOrderAlarms } from '@/lib/order-read-tracker';

export function BuyerOrdersPageSync({ activeCount }: { activeCount: number }) {
  useEffect(() => {
    if (activeCount === 0) {
      clearAllOrderAlarms();
    }
  }, [activeCount]);

  return null;
}
