import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { updateOrderStatus, validateAndConfirmOrder } from '@/app/actions/order-status';
import { OrderStatus } from '@/types/database';
import { RefreshCw, MessageCircle, Phone, Calendar, Clock, MapPin, Store, CheckCircle2 } from 'lucide-react';
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
      profiles!orders_buyer_id_fkey(id, full_name, town, phone),
      delivery_points(name, address_details),
      order_items(*, products(name))
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  const pendingOrders = orders?.filter((o) => o.status === 'pendiente') || [];
  const activeOrders = orders?.filter((o) => o.status !== 'pendiente') || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Gestión de Pedidos de Caserío</h1>
          <p className="text-xs font-bold text-stone-600 mt-0.5">
            Valida las compras de tus clientes y confirma la fecha de entrega
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/vendedor/calendario"
            className="inline-flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black text-xs px-3.5 py-2 rounded-xl border border-emerald-300 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4 text-emerald-800" />
            <span>Ver Calendario</span>
          </Link>
          <Link
            href="/vendedor/puntos-entrega"
            className="text-xs font-black text-stone-900 bg-white hover:bg-stone-100 border-2 border-stone-300 px-3.5 py-2 rounded-xl transition-colors shadow-sm"
          >
            Puntos de Entrega
          </Link>
        </div>
      </div>

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
            {pendingOrders.map((order) => {
              const baseOrderDate = new Date(order.created_at);
              baseOrderDate.setDate(baseOrderDate.getDate() + 1);
              const defaultDateStr = order.estimated_delivery_date
                ? order.estimated_delivery_date.split('T')[0]
                : baseOrderDate.toISOString().split('T')[0];

              return (
                <div
                  key={order.id}
                  className="bg-amber-50/80 rounded-3xl border-2 border-amber-300 p-5 sm:p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-200">
                    <div>
                      <span className="text-[10px] font-black uppercase bg-amber-200 text-amber-950 px-2 py-0.5 rounded-md">
                        Requiere tu confirmación
                      </span>
                      <h3 className="text-base font-black text-stone-900 mt-1">
                        Cliente: {order.profiles?.full_name} ({order.profiles?.town})
                      </h3>
                      {order.profiles?.phone && (
                        <p className="text-xs font-bold text-stone-700 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-stone-500" /> {order.profiles?.phone}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/chat/${order.profiles?.id}`}
                        className="p-2 bg-white hover:bg-stone-100 text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors border border-stone-300 shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Chat
                      </Link>
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="space-y-1 bg-white p-3.5 rounded-2xl border border-amber-200 shadow-inner">
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
                    <div className="pt-2 mt-2 border-t border-stone-200 flex justify-between text-xs font-black text-stone-900">
                      <span>Total Cobro</span>
                      <span className="text-base font-black text-emerald-900">
                        {Number(order.total_amount).toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  {/* Lugar de Entrega */}
                  <div className="text-xs font-semibold text-stone-800 bg-white p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                    {order.delivery_points ? (
                      <>
                        <Store className="w-4 h-4 text-emerald-800 shrink-0" />
                        <span>
                          Recogida en: <strong>{order.delivery_points.name}</strong> ({order.delivery_points.address_details})
                        </span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 text-emerald-800 shrink-0" />
                        <span>
                          Envío a domicilio: <strong>{order.shipping_address}</strong>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Formulario de Validación y Confirmación de Fecha */}
                  <form
                    action={async (formData) => {
                      'use server';
                      const confirmedDate = formData.get('confirmed_date') as string;
                      await validateAndConfirmOrder(order.id, confirmedDate);
                    }}
                    className="bg-white p-4 rounded-2xl border border-amber-300 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-black text-stone-900">
                          Confirmar fecha de entrega al cliente:
                        </label>
                        <input
                          type="date"
                          name="confirmed_date"
                          required
                          defaultValue={defaultDateStr}
                          className="px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-stone-50 focus:bg-white"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                        <button
                          type="submit"
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Aceptar y Confirmar
                        </button>
                        <CancelOrderButton orderId={order.id} label="Rechazar Pedido" />
                      </div>
                    </div>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: HISTORIAL Y PEDIDOS EN CURSO */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-stone-900">
          Pedidos Confirmados y en Curso ({activeOrders.length})
        </h2>

        {activeOrders.length > 0 ? (
          activeOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div>
                  <span className="text-base font-black text-stone-900">
                    Cliente: {order.profiles?.full_name} ({order.profiles?.town})
                  </span>
                  {order.profiles?.phone && (
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-stone-500" /> {order.profiles?.phone}
                    </span>
                  )}
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
                      <RefreshCw className="w-3 h-3" /> Periódico ({order.recurrence_interval_days}d)
                    </span>
                  )}
                </div>
              </div>

              {/* Fecha confirmada de entrega */}
              {order.estimated_delivery_date && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Fecha confirmada de entrega:{' '}
                    <strong>
                      {new Date(order.estimated_delivery_date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </strong>
                  </span>
                </div>
              )}

              {/* Items */}
              <div className="space-y-1 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
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
                <div className="pt-2 mt-2 border-t border-stone-300 flex justify-between text-xs font-black text-stone-900">
                  <span>Total Cobro</span>
                  <span className="text-sm font-black text-emerald-900">
                    {Number(order.total_amount).toFixed(2)} €
                  </span>
                </div>
              </div>

              {/* Lugar de Entrega */}
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
                      Dirección de envío:{' '}
                      <strong className="text-stone-900">{order.shipping_address}</strong>
                    </span>
                  </>
                )}
              </div>

              {/* Selector de Estado */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <form
                  action={async (formData) => {
                    'use server';
                    const nextStatus = formData.get('status') as OrderStatus;
                    await updateOrderStatus(order.id, nextStatus);
                  }}
                  className="flex items-center gap-2"
                >
                  <label className="text-xs font-black text-stone-800">Estado:</label>
                  <select
                    name="status"
                    defaultValue={order.status}
                    className="px-3 py-1.5 text-xs font-bold border-2 border-stone-300 rounded-xl bg-white text-stone-900 capitalize focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="confirmado">Confirmado / Aceptado</option>
                    <option value="preparando">Preparando Cosecha</option>
                    <option value="listo_entrega">Listo para Entrega</option>
                    <option value="entregado">Entregado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-stone-900 hover:bg-black text-white text-xs font-black px-4 py-2 rounded-xl transition-colors shadow-sm"
                  >
                    Actualizar
                  </button>
                </form>

                {order.status === 'entregado' && (
                  <ReviewForm orderId={order.id} targetId={order.buyer_id} />
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-stone-200 text-sm font-bold text-stone-700 p-6">
            <p>No tienes pedidos activos en curso.</p>
          </div>
        )}
      </div>
    </div>
  );
}