import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CalendarView, CalendarEvent } from '@/components/CalendarView';
import { Order, Product } from '@/types/database';

interface OrderWithBuyerAndItems extends Order {
  profiles?: {
    id: string;
    full_name: string;
    town: string;
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

export default async function SellerCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'vendedor') {
    redirect('/');
  }

  // 1. Obtener pedidos asignados al vendedor
  const { data: rawOrders } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!orders_buyer_id_fkey(id, full_name, town),
      delivery_points(name, address_details),
      order_items(*, products(name))
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

      events.push({
        id: `ord-${ord.id}`,
        type: 'order',
        date: dateStr,
        title: `Pedido de ${ord.profiles?.full_name || 'Cliente'}`,
        status: ord.status,
        amount: Number(ord.total_amount),
        customerName: ord.profiles?.full_name,
        deliveryType: ord.delivery_point_id ? 'sitio_fisico' : 'envio',
        deliveryLocation: ord.delivery_points
          ? `${ord.delivery_points.name} (${ord.delivery_points.address_details})`
          : ord.shipping_address || 'Entrega acordada',
        items: itemNames,
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
        });
      }
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      <div className="flex items-center justify-between">
        <Link
          href="/vendedor/pedidos"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a mis pedidos
        </Link>
      </div>

      <CalendarView events={events} role="vendedor" />
    </div>
  );
}
