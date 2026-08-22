import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CalendarView, CalendarEvent } from '@/components/CalendarView';
import { Order, Product } from '@/types/database';
import { getOrCreateUserProfile } from '@/lib/profile-utils';

interface OrderWithBuyerAndItems extends Order {
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
      image_url?: string | null;
    } | null;
  }[];
}

export default async function SellerCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const profile = await getOrCreateUserProfile(supabase, user);

  if (profile?.role !== 'vendedor') {
    redirect('/');
  }

  // 1. Obtener pedidos asignados al vendedor con fotos de producto
  const { data: rawOrders } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!orders_buyer_id_fkey(id, full_name, town, avatar_url),
      delivery_points(name, address_details),
      order_items(*, products(id, name, format, price, image_url, delivery_methods))
    `)
    .eq('seller_id', user.id);

  const orders = rawOrders as unknown as OrderWithBuyerAndItems[] | null;

  // 2. Obtener productos del vendedor que tengan fecha concreta
  const { data: rawProducts } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', user.id)
    .eq('availability_type', 'fecha_concreta')
    .not('available_from_date', 'is', null);

  const products = rawProducts as unknown as Product[] | null;

  const events: CalendarEvent[] = [];

  // Mapear pedidos
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

      events.push({
        id: `ord-${ord.id}`,
        type: 'order',
        date: dateStr,
        title: `Pedido de ${ord.profiles?.full_name || 'Cliente'}`,
        status: ord.status,
        amount: Number(ord.total_amount),
        customerName: ord.profiles?.full_name,
        customerAvatarUrl: ord.profiles?.avatar_url || null,
        deliveryType: dType,
        deliveryLocation: dLoc,
        items: itemNames,
        orderProducts,
        chatUserId: ord.profiles?.id,
      });
    });
  }

  // Mapear cosechas programadas
  if (products) {
    products.forEach((prod) => {
      if (prod.available_from_date) {
        events.push({
          id: `prod-${prod.id}`,
          type: 'product_available',
          date: prod.available_from_date,
          title: `Cosecha lista: ${prod.name}`,
          subtitle: `${prod.stock} ${prod.format === 'granel' ? 'kg' : 'uds'} disponibles`,
          amount: Number(prod.price),
          productImageUrl: prod.image_url,
        });
      }
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2">
      <CalendarView events={events} role="vendedor" />
    </div>
  );
}
