import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CalendarView, CalendarEvent } from '@/components/CalendarView';
import { Order } from '@/types/database';

interface OrderWithSellerAndItems extends Order {
  profiles?: {
    id: string;
    full_name: string;
    town: string;
    avatar_url?: string | null;
  } | null;
  delivery_points?: {
    name: string;
    address_details: string;
  } | null;
  order_items?: {
    id: string;
    quantity: number;
    products?: {
      name: string;
    } | null;
  }[];
}

export default async function BuyerCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Obtener pedidos del comprador
  const { data: rawOrders } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!orders_seller_id_fkey(id, full_name, town, avatar_url),
      delivery_points(name, address_details),
      order_items(*, products(name))
    `)
    .eq('buyer_id', user.id);

  const orders = rawOrders as unknown as OrderWithSellerAndItems[] | null;

  const events: CalendarEvent[] = [];

  if (orders) {
    orders.forEach((ord) => {
      const dateStr = ord.estimated_delivery_date
        ? ord.estimated_delivery_date.split('T')[0]
        : ord.created_at.split('T')[0];

      const itemNames = ord.order_items
        ?.map((it) => `${it.products?.name} (x${it.quantity})`)
        .join(', ');

      events.push({
        id: `ord-${ord.id}`,
        type: 'order',
        date: dateStr,
        title: `Entrega de ${ord.profiles?.full_name || 'Caserío'}`,
        status: ord.status,
        amount: Number(ord.total_amount),
        sellerName: ord.profiles?.full_name,
        sellerAvatarUrl: ord.profiles?.avatar_url || null,
        deliveryType: ord.delivery_point_id ? 'sitio_fisico' : 'envio',
        deliveryLocation: ord.delivery_points
          ? `Recogida en: ${ord.delivery_points.name} (${ord.delivery_points.address_details})`
          : `Envío a domicilio: ${ord.shipping_address || 'Dirección acordada'}`,
        items: itemNames,
        chatUserId: ord.profiles?.id,
      });
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      <div className="flex items-center justify-between">
        <Link
          href="/comprador/pedidos"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a mis compras
        </Link>
      </div>

      <CalendarView events={events} role="comprador" />
    </div>
  );
}
