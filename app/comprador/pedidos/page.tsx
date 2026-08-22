import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BuyerOrderCard } from '@/components/BuyerOrderCard';
import { OrdersHistorySection } from '@/components/OrdersHistorySection';

export default async function BuyerOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!orders_seller_id_fkey(id, full_name, town, address, phone, avatar_url),
      delivery_points(name, town, address_details, opening_time, closing_time, schedule_notes),
      order_items(*, products(id, name, format, image_url, delivery_methods))
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  // Pedidos activos (en curso / pendientes / confirmados)
  const activeOrders = orders?.filter((o) => o.status !== 'entregado' && o.status !== 'cancelado') || [];
  // Todo el histórico (últimos 100 pedidos)
  const historyOrders = orders || [];

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border-2 border-stone-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900">Mis Compras</h1>
          <p className="text-xs font-bold text-stone-600 mt-0.5">
            Pedidos en curso, validaciones de caseríos y fechas confirmadas de entrega
          </p>
        </div>

        <Link
          href="/cesta"
          className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 font-black text-xs px-3.5 py-2 rounded-xl border border-stone-300 transition-colors shadow-sm"
        >
          <span>Ver mi Cesta</span>
        </Link>
      </div>

      {/* Lista de Pedidos Activos */}
      <div className="space-y-4">
        {activeOrders.length > 0 ? (
          activeOrders.map((order) => (
            <BuyerOrderCard key={order.id} order={order} />
          ))
        ) : (
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-8 text-center space-y-3">
            <h3 className="text-lg font-black text-stone-800">No tienes pedidos activos en curso</h3>
            <p className="text-xs font-bold text-stone-500">
              Explora los caseríos de tu zona y haz tu compra km0 o consulta tus pedidos anteriores en el histórico abajo.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-md transition-all mt-2"
            >
              <span>Explorar el Mercado</span>
            </Link>
          </div>
        )}
      </div>

      {/* Sección de Histórico desplegable (abajo del todo) */}
      <OrdersHistorySection orders={historyOrders} role="comprador" />
    </div>
  );
}