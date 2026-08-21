import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RefreshCw, MapPin, Store, MessageCircle, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import ReviewForm from '@/components/ReviewForm';
import { CancelOrderButton } from '@/components/CancelOrderButton';

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    pendiente: 'bg-amber-100 text-amber-950 border-amber-300',
    confirmado: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    preparando: 'bg-purple-100 text-purple-950 border-purple-300',
    listo_entrega: 'bg-blue-100 text-blue-950 border-blue-300',
    entregado: 'bg-stone-200 text-stone-900 border-stone-300',
    cancelado: 'bg-red-100 text-red-950 border-red-300',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Mis Compras</h1>
          <p className="text-xs font-bold text-stone-600 mt-0.5">
            Historial de pedidos, validaciones de caseríos y fechas confirmadas de entrega
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/cesta"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-stone-100 text-stone-900 font-black text-xs px-3.5 py-2 rounded-xl border border-stone-300 transition-colors shadow-sm"
          >
            <span>Ver mi Cesta</span>
          </Link>
          <Link
            href="/comprador/calendario"
            className="inline-flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black text-xs px-3.5 py-2 rounded-xl border border-emerald-300 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4 text-emerald-800" />
            <span>Ver en Calendario</span>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {orders && orders.length > 0 ? (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div>
                  <span className="text-sm font-black text-stone-900">
                    Caserío: {order.profiles?.full_name} ({order.profiles?.town})
                  </span>
                  <p className="text-xs font-semibold text-stone-600">
                    Pedido realizado el {new Date(order.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/chat/${order.profiles?.id}`}
                    className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors border border-stone-200"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Chat
                  </Link>
                  {order.is_recurring && (
                    <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-md">
                      <RefreshCw className="w-3 h-3" /> Recurrente ({order.recurrence_interval_days}d)
                    </span>
                  )}
                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full border capitalize ${
                      statusColors[order.status] || ''
                    }`}
                  >
                    {order.status === 'pendiente'
                      ? 'Por Validar'
                      : order.status === 'confirmado'
                      ? 'Confirmado por Caserío'
                      : order.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Mensaje de Validación y Fecha de Entrega */}
              {order.status === 'pendiente' ? (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-bold text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0 animate-pulse" />
                    <span>
                      El caserío está revisando tu pedido para confirmar la fecha exacta de entrega.
                    </span>
                  </div>

                  <CancelOrderButton orderId={order.id} />
                </div>
              ) : order.estimated_delivery_date ? (
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Fecha de entrega confirmada:{' '}
                    <strong>
                      {new Date(order.estimated_delivery_date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </strong>
                  </span>
                </div>
              ) : null}

              {/* Productos */}
              <div className="space-y-1.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                {order.order_items?.map((item: OrderItemWithProduct) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-xs font-bold text-stone-900"
                  >
                    <span>
                      {item.products?.name} x {item.quantity}
                    </span>
                    <span className="font-black">
                      {Number(item.subtotal).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>

              {/* Modalidad de entrega */}
              <div className="text-xs font-semibold text-stone-800 bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center gap-2">
                {order.delivery_points ? (
                  <>
                    <Store className="w-4 h-4 text-emerald-800 shrink-0" />
                    <span>
                      Punto de recogida:{' '}
                      <strong className="text-stone-900">{order.delivery_points.name}</strong> (
                      {order.delivery_points.address_details})
                    </span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-emerald-800 shrink-0" />
                    <span>
                      Envío a domicilio:{' '}
                      <strong className="text-stone-900">{order.shipping_address}</strong>
                    </span>
                  </>
                )}
              </div>

              {/* Total y Valoración */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-stone-100">
                <div className="text-base font-black text-stone-900">
                  Total: {Number(order.total_amount).toFixed(2)} €
                </div>

                {order.status === 'entregado' && (
                  <ReviewForm orderId={order.id} targetId={order.seller_id} />
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-stone-200 text-sm font-bold text-stone-700 p-8 space-y-3">
            <p>No tienes compras registradas aún.</p>
            <Link
              href="/"
              className="inline-block bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-sm"
            >
              Explorar Catálogo km0
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}