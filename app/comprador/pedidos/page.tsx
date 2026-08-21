import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RefreshCw, MapPin, Store, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import ReviewForm from '@/components/ReviewForm';

interface OrderItemWithProduct {
  id: string;
  quantity: number;
  subtotal: number;
  products?: {
    name: string;
  } | null;
}

export default async function BuyerOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!orders_seller_id_fkey(id, full_name, town, phone),
      delivery_points(name, town, address_details),
      order_items(*, products(name))
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  const statusColors: Record<string, string> = {
    pendiente: 'bg-amber-50 text-amber-800 border-amber-200',
    confirmado: 'bg-blue-50 text-blue-800 border-blue-200',
    preparando: 'bg-purple-50 text-purple-800 border-purple-200',
    listo_entrega: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    entregado: 'bg-stone-100 text-stone-700 border-stone-200',
    cancelado: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Mis Compras</h1>
          <p className="text-xs text-stone-500 mt-1">Historial, pedidos activos y compras recurrentes</p>
        </div>
      </div>

      <div className="space-y-4">
        {orders && orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div>
                  <span className="text-xs font-bold text-stone-900">
                    Caserío: {order.profiles?.full_name} ({order.profiles?.town})
                  </span>
                  <p className="text-[11px] text-stone-500">
                    Fecha: {new Date(order.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/chat/${order.profiles?.id}`}
                    className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs flex items-center gap-1 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Chat
                  </Link>
                  {order.is_recurring && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <RefreshCw className="w-3 h-3" /> Recurrente ({order.recurrence_interval_days}d)
                    </span>
                  )}
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${statusColors[order.status] || ''}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Productos */}
              <div className="space-y-1.5">
                {order.order_items?.map((item: OrderItemWithProduct) => (
                  <div key={item.id} className="flex justify-between text-xs text-stone-700">
                    <span>{item.products?.name} x {item.quantity}</span>
                    <span className="font-semibold">{Number(item.subtotal).toFixed(2)} €</span>
                  </div>
                ))}
              </div>

              {/* Modalidad de entrega */}
              <div className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-lg flex items-center gap-2">
                {order.delivery_points ? (
                  <>
                    <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Recogida en: {order.delivery_points.name} ({order.delivery_points.address_details})</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Entrega a domicilio: {order.shipping_address}</span>
                  </>
                )}
              </div>

              {/* Total y Valoración */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-stone-100">
                <div className="text-sm font-extrabold text-stone-900">
                  Total: {Number(order.total_amount).toFixed(2)} €
                </div>

                {order.status === 'entregado' && (
                  <ReviewForm orderId={order.id} targetId={order.seller_id} />
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 text-xs text-stone-500">
            No tienes compras registradas aún.
          </div>
        )}
      </div>
    </div>
  );
}