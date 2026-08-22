import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
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
    opening_time?: string | null;
    closing_time?: string | null;
    schedule_notes?: string | null;
  } | null;
  order_items?: {
    id: string;
    quantity: number;
    products?: {
      name: string;
      image_url?: string | null;
    } | null;
  }[];
}

export default async function BuyerCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Obtener pedidos del comprador con productos y fotos
  const { data: rawOrders } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!orders_seller_id_fkey(id, full_name, town, avatar_url),
      delivery_points(name, address_details, opening_time, closing_time, schedule_notes),
      order_items(*, products(id, name, format, price, image_url, delivery_methods))
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

      const orderProducts = ord.order_items?.map((it) => ({
        name: it.products?.name || 'Producto',
        quantity: it.quantity,
        format: (it.products as any)?.format || 'ud',
        unitPrice: Number((it.products as any)?.price) || null,
        imageUrl: it.products?.image_url || null,
        deliveryMethods: (it.products as any)?.delivery_methods || null,
      }));

      const isPunto = !!ord.delivery_points;
      const isEnvio = !isPunto && ord.shipping_address && ord.shipping_address !== 'Recogida directa en Caserío';
      const dType = isPunto ? 'sitio_fisico' : isEnvio ? 'envio' : 'caserio';
      const dLoc = isPunto
        ? `Punto: ${ord.delivery_points?.name} (${ord.delivery_points?.address_details})`
        : isEnvio
        ? `Envío: ${ord.shipping_address?.replace(/^Para:\s*/i, '')}`
        : 'Recogida en caserío';

      const scheduleStr = ord.delivery_points?.opening_time && ord.delivery_points?.closing_time
        ? `${ord.delivery_points.opening_time} - ${ord.delivery_points.closing_time}`
        : ord.delivery_points?.schedule_notes || null;

      events.push({
        id: `ord-${ord.id}`,
        type: 'order',
        date: dateStr,
        title: `Entrega de ${ord.profiles?.full_name || 'Caserío'}`,
        status: ord.status,
        amount: Number(ord.total_amount),
        sellerName: ord.profiles?.full_name,
        sellerAvatarUrl: ord.profiles?.avatar_url || null,
        deliveryType: dType,
        deliveryLocation: dLoc,
        deliverySchedule: scheduleStr,
        items: itemNames,
        orderProducts,
        chatUserId: ord.profiles?.id,
      });
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2">
      <CalendarView events={events} role="comprador" />
    </div>
  );
}
