'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function createOrder(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Debes iniciar sesión para realizar un pedido.' };
  }

  const productId = formData.get('product_id') as string;
  const sellerId = formData.get('seller_id') as string;
  const quantity = parseInt(formData.get('quantity') as string, 10);
  const deliveryType = formData.get('delivery_type') as string;
  const deliveryPointId = (formData.get('delivery_point_id') as string) || null;
  const shippingAddress = (formData.get('shipping_address') as string) || null;
  const isRecurring = formData.get('is_recurring') === 'on';
  const recurrenceInterval = isRecurring
    ? parseInt((formData.get('recurrence_interval_days') as string) || '7', 10)
    : null;

  // Obtener precio y verificar stock
  const { data: product, error: prodError } = await supabase
    .from('products')
    .select('price, discount_percentage, stock')
    .eq('id', productId)
    .single();

  if (prodError || !product) {
    return { error: 'Producto no disponible.' };
  }

  if (product.stock < quantity) {
    return { error: `Stock insuficiente. Solo quedan ${product.stock} unidades.` };
  }

  const unitPrice =
    product.discount_percentage > 0
      ? product.price * (1 - product.discount_percentage / 100)
      : product.price;

  const totalAmount = unitPrice * quantity;

  // 1. Crear el Pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      seller_id: sellerId,
      delivery_point_id: deliveryType === 'sitio_fisico' ? deliveryPointId : null,
      shipping_address: deliveryType === 'envio' ? shippingAddress : null,
      status: 'pendiente',
      total_amount: totalAmount,
      is_recurring: isRecurring,
      recurrence_interval_days: recurrenceInterval,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    return { error: orderError?.message || 'Error al procesar el pedido.' };
  }

  // 2. Insertar línea de pedido
  const { error: itemError } = await supabase.from('order_items').insert({
    order_id: order.id,
    product_id: productId,
    quantity,
    unit_price: unitPrice,
    subtotal: totalAmount,
  });

  if (itemError) {
    return { error: itemError.message };
  }

  // 3. Actualizar stock del producto
  await supabase
    .from('products')
    .update({ stock: product.stock - quantity })
    .eq('id', productId);

  revalidatePath('/comprador/pedidos');
  redirect('/comprador/pedidos');
}