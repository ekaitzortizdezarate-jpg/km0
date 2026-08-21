'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { OrderStatus } from '@/types/database';

export async function validateAndConfirmOrder(orderId: string, confirmedDeliveryDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado.' };

  const updateData: Record<string, unknown> = {
    status: 'confirmado',
    updated_at: new Date().toISOString(),
  };

  if (confirmedDeliveryDate) {
    updateData.estimated_delivery_date = new Date(confirmedDeliveryDate + 'T12:00:00').toISOString();
  }

  // Intento 1: Actualizar con fecha estimada
  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .eq('seller_id', user.id);

  if (error) {
    // Fallback si la columna estimated_delivery_date no existe en Supabase
    const { error: fallbackError } = await supabase
      .from('orders')
      .update({ status: 'confirmado', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('seller_id', user.id);

    if (fallbackError) {
      return { error: fallbackError.message };
    }
  }

  revalidatePath('/vendedor/pedidos');
  revalidatePath('/comprador/pedidos');
  revalidatePath('/vendedor/calendario');
  revalidatePath('/comprador/calendario');
  revalidatePath('/cesta');
  return { success: true };
}

export async function rejectOrderWithReason(orderId: string, message?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado.' };

  // 1. Obtener pedido
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return { error: 'Pedido no encontrado.' };
  }

  if (order.seller_id !== user.id && order.buyer_id !== user.id) {
    return { error: 'No tienes permiso para rechazar este pedido.' };
  }

  // 2. Restaurar stock de los productos
  if (order.order_items && order.order_items.length > 0) {
    for (const item of order.order_items) {
      const { data: prod } = await supabase
        .from('products')
        .select('stock, is_unlimited_stock')
        .eq('id', item.product_id)
        .single();

      if (prod && !prod.is_unlimited_stock) {
        await supabase
          .from('products')
          .update({ stock: prod.stock + item.quantity })
          .eq('id', item.product_id);
      }
    }
  }

  // 3. Enviar mensaje en el chat al comprador si se introdujo motivo
  if (message && message.trim()) {
    try {
      await supabase.from('chat_messages').insert({
        sender_id: user.id,
        receiver_id: order.buyer_id,
        order_id: order.id,
        message: `❌ Pedido rechazado por el caserío: "${message.trim()}"`,
        is_read: false,
      });
    } catch {
      // Ignore chat error if chat table is not populated yet
    }
  }

  // 4. Eliminar pedido y sus ítems de la base de datos
  await supabase.from('order_items').delete().eq('order_id', orderId);
  const { error: delErr } = await supabase.from('orders').delete().eq('id', orderId);

  if (delErr) {
    await supabase
      .from('orders')
      .update({ status: 'cancelado', updated_at: new Date().toISOString() })
      .eq('id', orderId);
  }

  revalidatePath('/vendedor/pedidos');
  revalidatePath('/comprador/pedidos');
  revalidatePath('/vendedor/calendario');
  revalidatePath('/comprador/calendario');
  revalidatePath('/cesta');

  return { success: true };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado.' };

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) return { error: error.message };

  revalidatePath('/vendedor/pedidos');
  revalidatePath('/comprador/pedidos');
  revalidatePath('/vendedor/calendario');
  revalidatePath('/comprador/calendario');
  revalidatePath('/cesta');
  return { success: true };
}