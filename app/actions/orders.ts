'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export interface CartCheckoutSellerGroup {
  sellerId: string;
  deliveryType: 'caserio' | 'sitio_fisico' | 'envio';
  deliveryPointId?: string | null;
  shippingAddress?: string | null;
  estimatedDeliveryDate?: string | null;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export async function createCartOrders(sellerGroups: CartCheckoutSellerGroup[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Debes iniciar sesión para realizar la compra.' };
  }

  if (!sellerGroups || sellerGroups.length === 0) {
    return { error: 'La cesta está vacía.' };
  }

  try {
    // 0. Comprobar stock disponible de todos los productos antes de crear pedidos
    for (const group of sellerGroups) {
      for (const item of group.items) {
        const { data: prod } = await supabase
          .from('products')
          .select('name, stock, is_unlimited_stock')
          .eq('id', item.productId)
          .single();

        if (prod && !prod.is_unlimited_stock && prod.stock < item.quantity) {
          return {
            error: `No hay suficiente stock para "${prod.name}". Stock disponible: ${prod.stock} (solicitado en la cesta: ${item.quantity}).`,
          };
        }
      }
    }

    for (const group of sellerGroups) {
      const groupTotal = group.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );

      // Intento 1: Insertar pedido con estimated_delivery_date
      let orderId: string | null = null;

      const shippingAddressVal =
        group.deliveryType === 'envio'
          ? group.shippingAddress || null
          : group.deliveryType === 'caserio'
          ? 'Recogida directa en Caserío'
          : null;

      const fullOrderPayload = {
        buyer_id: user.id,
        seller_id: group.sellerId,
        delivery_point_id: group.deliveryType === 'sitio_fisico' ? group.deliveryPointId || null : null,
        shipping_address: shippingAddressVal,
        status: 'pendiente',
        total_amount: groupTotal,
        is_recurring: false,
        estimated_delivery_date: group.estimatedDeliveryDate || null,
      };

      const { data: fullOrder, error: fullOrderErr } = await supabase
        .from('orders')
        .insert(fullOrderPayload)
        .select('id')
        .single();

      if (fullOrderErr) {
        // Fallback si la columna estimated_delivery_date aún no existe en Supabase
        const fallbackOrderPayload = {
          buyer_id: user.id,
          seller_id: group.sellerId,
          delivery_point_id: group.deliveryType === 'sitio_fisico' ? group.deliveryPointId || null : null,
          shipping_address: group.deliveryType === 'envio' ? group.shippingAddress || null : null,
          status: 'pendiente',
          total_amount: groupTotal,
          is_recurring: false,
        };

        const { data: fallbackOrder, error: fallbackErr } = await supabase
          .from('orders')
          .insert(fallbackOrderPayload)
          .select('id')
          .single();

        if (fallbackErr || !fallbackOrder) {
          return { error: fallbackErr?.message || 'Error al procesar el pedido.' };
        }
        orderId = fallbackOrder.id;
      } else {
        orderId = fullOrder.id;
      }

      // Insertar líneas del pedido
      for (const item of group.items) {
        await supabase.from('order_items').insert({
          order_id: orderId,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.unitPrice * item.quantity,
        });

        // Actualizar stock
        const { data: prod } = await supabase
          .from('products')
          .select('stock, is_unlimited_stock')
          .eq('id', item.productId)
          .single();

        if (prod && !prod.is_unlimited_stock) {
          await supabase
            .from('products')
            .update({ stock: Math.max(0, prod.stock - item.quantity) })
            .eq('id', item.productId);
        }
      }
    }

    revalidatePath('/cesta');
    revalidatePath('/comprador/pedidos');
    revalidatePath('/vendedor/pedidos');
    revalidatePath('/comprador/calendario');
    revalidatePath('/vendedor/calendario');

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al tramitar la cesta.';
    return { error: message };
  }
}

export async function cancelPendingOrder(orderId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Debes iniciar sesión.' };
  }

  // 1. Obtener pedido
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return { error: 'Pedido no encontrado.' };
  }

  // Solo el comprador o vendedor pueden cancelarlo, y solo si está pendiente
  if (order.buyer_id !== user.id && order.seller_id !== user.id) {
    return { error: 'No tienes permiso para cancelar este pedido.' };
  }

  if (order.status !== 'pendiente') {
    return { error: 'Solo se pueden eliminar o cancelar pedidos que están pendientes de validar.' };
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

  // 3. Eliminar líneas y pedido de la base de datos
  await supabase.from('order_items').delete().eq('order_id', orderId);
  const { error: delErr } = await supabase.from('orders').delete().eq('id', orderId);

  if (delErr) {
    return { error: delErr.message };
  }

  revalidatePath('/cesta');
  revalidatePath('/comprador/pedidos');
  revalidatePath('/vendedor/pedidos');
  revalidatePath('/comprador/calendario');
  revalidatePath('/vendedor/calendario');

  return { success: true };
}

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
  const estimatedDeliveryDate = (formData.get('estimated_delivery_date') as string) || null;

  // Obtener precio y verificar stock
  const { data: product, error: prodError } = await supabase
    .from('products')
    .select('price, price_per_kilo, format, discount_percentage, stock, is_unlimited_stock')
    .eq('id', productId)
    .single();

  if (prodError || !product) {
    return { error: 'Producto no disponible.' };
  }

  if (!product.is_unlimited_stock && product.stock < quantity) {
    return { error: `Stock insuficiente. Solo quedan ${product.stock} unidades / kg.` };
  }

  const basePrice = product.format === 'granel'
    ? (product.price_per_kilo || product.price)
    : product.price;

  const unitPrice =
    product.discount_percentage > 0
      ? basePrice * (1 - product.discount_percentage / 100)
      : basePrice;

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
      estimated_delivery_date: estimatedDeliveryDate,
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

  // 3. Actualizar stock del producto (si no es ilimitado)
  if (!product.is_unlimited_stock) {
    await supabase
      .from('products')
      .update({ stock: Math.max(0, product.stock - quantity) })
      .eq('id', productId);
  }

  revalidatePath('/cesta');
  revalidatePath('/comprador/pedidos');
  revalidatePath('/vendedor/pedidos');
  revalidatePath('/comprador/calendario');
  revalidatePath('/vendedor/calendario');
  redirect('/cesta');
}