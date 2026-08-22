'use client';

const READ_ORDERS_STORAGE_KEY = 'km0_read_orders_map';

export function getReadOrdersMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(READ_ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isOrderUnread(orderId: string, orderUpdatedAt?: string | null): boolean {
  if (typeof window === 'undefined') return false;
  const readMap = getReadOrdersMap();
  const lastRead = readMap[orderId];
  if (!lastRead) return true;
  if (!orderUpdatedAt) return false;
  return new Date(orderUpdatedAt).getTime() > new Date(lastRead).getTime();
}

export function markOrderAsRead(orderId: string, orderUpdatedAt?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const readMap = getReadOrdersMap();
    readMap[orderId] = orderUpdatedAt || new Date().toISOString();
    localStorage.setItem(READ_ORDERS_STORAGE_KEY, JSON.stringify(readMap));
    window.dispatchEvent(new CustomEvent('km0_orders_read_updated', { detail: { orderId } }));
  } catch (err) {
    console.error('Error saving read order state:', err);
  }
}

export function getUnreadOrdersCount(
  orders: { id: string; updated_at?: string; created_at?: string; status?: string }[],
  role: 'comprador' | 'vendedor'
): number {
  if (typeof window === 'undefined') return 0;
  const readMap = getReadOrdersMap();
  let count = 0;
  for (const o of orders) {
    const timestamp = o.updated_at || o.created_at || '';
    const lastRead = readMap[o.id];
    const isUnread = !lastRead || (timestamp && new Date(timestamp).getTime() > new Date(lastRead).getTime());
    if (isUnread) {
      if (role === 'vendedor') {
        count++;
      } else {
        count++;
      }
    }
  }
  return count;
}
