import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Store } from 'lucide-react';
import { SellerActiveOrderCard } from '@/components/SellerActiveOrderCard';
import { SellerPendingOrderCard } from '@/components/SellerPendingOrderCard';
import { OrdersHistorySection } from '@/components/OrdersHistorySection';

export default async function SellerOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!orders_buyer_id_fkey(id, full_name, town, address, phone, avatar_url),
      delivery_points(name, town, address_details, opening_time, closing_time, schedule_notes),
      order_items(*, products(id, name, format, image_url, delivery_methods))
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const pendingOrders = orders?.filter((o) => o.status === 'pendiente') || [];
  const activeOrders =
    orders?.filter((o) => o.status !== 'pendiente' && o.status !== 'entregado' && o.status !== 'cancelado') || [];
  const historyOrders = orders || [];

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      {/* SECCIÓN 1: PEDIDOS PENDIENTES DE VALIDAR POR EL VENDEDOR */}
      {pendingOrders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            <h2 className="text-lg font-black text-stone-900">
              Nuevos Pedidos por Validar ({pendingOrders.length})
            </h2>
          </div>

          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <SellerPendingOrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: PEDIDOS ACTIVOS Y VALIDADOS */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-stone-900">
          Pedidos Validados y en Curso ({activeOrders.length})
        </h2>

        {activeOrders.length > 0 ? (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <SellerActiveOrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-8 text-center space-y-2">
            <Store className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-xs font-bold text-stone-600">
              No tienes pedidos activos en curso.
            </p>
          </div>
        )}
      </div>

      {/* SECCIÓN 3: HISTÓRICO DE PEDIDOS (DESPLEGABLE) */}
      <OrdersHistorySection orders={historyOrders} role="vendedor" />
    </div>
  );
}