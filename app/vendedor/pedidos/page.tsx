import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { updateOrderStatus } from '@/app/actions/order-status';
import { OrderStatus } from '@/types/database';
import { RefreshCw, MessageCircle, Phone } from 'lucide-react';
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

export default async function SellerOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Gestión de Pedidos de Caserío</h1>
          <p className="text-xs text-stone-500 mt-1">Controla el estado de entrega y pedidos de tus clientes</p>
        </div>
        <Link
          href="/vendedor/puntos-entrega"
          className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          Gestionar Puntos de Entrega
        </Link>
      </div>

      <div className="space-y-4">
        {orders && orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div>
                  <span className="text-sm font-bold text-stone-900">
                    Cliente: {order.profiles?.full_name} ({order.profiles?.town})
                  </span>
                  {order.profiles?.phone && (
                    <span className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {order.profiles?.phone}
                    </span>
                  )}
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
                      <RefreshCw className="w-3 h-3" /> Periódico
                    </span>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1 bg-stone-50 p-3 rounded-xl">
                {order.order_items?.map((item: OrderItemWithProduct) => (
                  <div key={item.id} className="flex justify-between text-xs text-stone-800">
                    <span>{item.products?.name} x {item.quantity}</span>
                    <span className="font-semibold">{Number(item.subtotal).toFixed(2)} €</span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-stone-200 flex justify-between text-xs font-bold text-stone-900">
                  <span>Total Cobro</span>
                  <span>{Number(order.total_amount).toFixed(2)} €</span>
                </div>
              </div>

              {/* Selector de Estado */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <form action={async (formData) => {
                  'use server';
                  const nextStatus = formData.get('status') as OrderStatus;
                  await updateOrderStatus(order.id, nextStatus);
                }} className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-stone-600">Estado:</label>
                  <select
                    name="status"
                    defaultValue={order.status}
                    className="px-2.5 py-1 text-xs border border-stone-300 rounded-lg bg-white font-medium capitalize"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="preparando">Preparando</option>
                    <option value="listo_entrega">Listo para Entrega</option>
                    <option value="entregado">Entregado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                  <button type="submit" className="bg-stone-900 hover:bg-black text-white text-xs px-3 py-1 rounded-lg">
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
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 text-xs text-stone-500">
            No has recibido pedidos aún.
          </div>
        )}
      </div>
    </div>
  );
}