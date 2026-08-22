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

/**
 * Determina si un pedido debe iluminarse como no leído según el rol del usuario actual.
 * Regla clave solicitada:
 * No se le ilumina la tarjeta a quien genera el cambio de estado en el pedido:
 *
 * - Para Comprador:
 *   - Si el pedido está 'pendiente' (recién realizado por el comprador), NO se ilumina.
 *   - Si el vendedor lo validó o cambió su estado ('confirmado', 'preparando', 'listo_entrega', 'entregado', 'cancelado'),
 *     SÍ se ilumina para el comprador hasta que pulse "Leído".
 *
 * - Para Vendedor:
 *   - Si el pedido está 'pendiente' (solicitado por el comprador), SÍ se ilumina para el vendedor hasta que lo valide o pulse "Leído".
 *   - Si el pedido ya está validado o en curso ('confirmado', etc.), el cambio lo hizo el propio vendedor, por lo que NO se le ilumina al vendedor.
 */
export function isOrderUnreadForRole(
  order: { id: string; status?: string; updated_at?: string | null; created_at?: string | null },
  role: 'comprador' | 'vendedor'
): boolean {
  if (typeof window === 'undefined') return false;

  const readMap = getReadOrdersMap();
  const lastRead = readMap[order.id];
  const orderTimestamp = order.updated_at || order.created_at || '';

  if (role === 'comprador') {
    // Si sigue en 'pendiente', lo generó el comprador -> no iluminar
    if (order.status === 'pendiente') {
      return false;
    }
    // Si el vendedor lo validó o cambió de estado:
    if (!lastRead) return true;
    return new Date(orderTimestamp).getTime() > new Date(lastRead).getTime();
  }

  if (role === 'vendedor') {
    // Si está 'pendiente', es un nuevo pedido generado por el comprador -> iluminar al vendedor
    if (order.status === 'pendiente') {
      if (!lastRead) return true;
      return new Date(orderTimestamp).getTime() > new Date(lastRead).getTime();
    }
    // Los pedidos validados los cambia el vendedor -> no iluminar al vendedor
    return false;
  }

  return false;
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
  let count = 0;
  for (const o of orders) {
    if (isOrderUnreadForRole(o, role)) {
      count++;
    }
  }
  return count;
}
