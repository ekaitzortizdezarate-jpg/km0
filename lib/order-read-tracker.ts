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
 * Reglas:
 * 1. Para Comprador:
 *    - 'pendiente': Creado por el comprador -> NO se ilumina.
 *    - 'entregado' o 'cancelado': Pedidos ya finalizados/cerrados -> NO se ilumina.
 *    - 'confirmado', 'preparando', 'listo_entrega': Modificados por el vendedor -> SÍ se ilumina
 *      hasta que el comprador pulse "Leído".
 *
 * 2. Para Vendedor:
 *    - 'pendiente': Nuevo pedido hecho por un cliente -> SÍ se ilumina hasta que el vendedor lo valide o pulse "Leído".
 *    - Cualquier otro estado: Gestionado por el propio vendedor -> NO se ilumina.
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
    // Si sigue en 'pendiente' (hecho por el propio comprador), no hay alarma
    if (!order.status || order.status === 'pendiente') {
      return false;
    }
    // Si ya está terminado o cancelado, no debe mantener la alarma encendida
    if (order.status === 'entregado' || order.status === 'cancelado') {
      return false;
    }
    // Pedidos en curso actualizados por el vendedor ('confirmado', 'preparando', 'listo_entrega'):
    if (!lastRead) return true;
    return new Date(orderTimestamp).getTime() > new Date(lastRead).getTime();
  }

  if (role === 'vendedor') {
    // Si está 'pendiente', es un nuevo pedido que requiere validación del vendedor
    if (order.status === 'pendiente') {
      if (!lastRead) return true;
      return new Date(orderTimestamp).getTime() > new Date(lastRead).getTime();
    }
    // Los pedidos validados ya los gestiona el vendedor
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

export function markAllOrdersAsRead(orderIds: string[]) {
  if (typeof window === 'undefined' || !orderIds || orderIds.length === 0) return;
  try {
    const readMap = getReadOrdersMap();
    const now = new Date().toISOString();
    for (const id of orderIds) {
      readMap[id] = now;
    }
    localStorage.setItem(READ_ORDERS_STORAGE_KEY, JSON.stringify(readMap));
    window.dispatchEvent(new CustomEvent('km0_orders_read_updated'));
  } catch (err) {
    console.error('Error saving all read orders state:', err);
  }
}

export function clearAllOrderAlarms() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(READ_ORDERS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('km0_orders_read_updated'));
  } catch (err) {
    console.error('Error clearing read orders state:', err);
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
