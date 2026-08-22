'use server';

import { revalidatePath } from 'next/cache';
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

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  town: string;
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
    // 0. Comprobar stock disponible en una única consulta por lotes
    const allProductIds = Array.from(
      new Set(sellerGroups.flatMap((g) => g.items.map((i) => i.productId)))
    );
    const { data: allProds } = await supabase
      .from('products')
      .select('id, name, stock, is_unlimited_stock')
      .in('id', allProductIds);

    const prodsMap = new Map((allProds || []).map((p) => [p.id, p]));

    for (const group of sellerGroups) {
      for (const item of group.items) {
        const qty = Number(item.quantity) || 1;
        const prod = prodsMap.get(item.productId);
        if (prod && !prod.is_unlimited_stock) {
          const currentStock = Number(prod.stock) || 0;
          if (currentStock < qty) {
            return {
              error: `No hay suficiente stock para "${prod.name}". Stock disponible: ${currentStock} (solicitado en la cesta: ${qty}).`,
            };
          }
        }
      }
    }

    for (const group of sellerGroups) {
      const groupTotal = group.items.reduce(
        (sum, item) => sum + item.unitPrice * (Number(item.quantity) || 1),
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

      // Insertar todas las líneas del pedido en un único batch
      const orderItemsPayload = group.items.map((item) => {
        const qty = Number(item.quantity) || 1;
        return {
          order_id: orderId,
          product_id: item.productId,
          quantity: qty,
          unit_price: item.unitPrice,
          subtotal: item.unitPrice * qty,
        };
      });

      await supabase.from('order_items').insert(orderItemsPayload);

      // Descontar stock de forma segura y concurrente
      await Promise.all(
        group.items.map(async (item) => {
          const qty = Number(item.quantity) || 1;
          const { error: rpcErr } = await supabase.rpc('decrement_product_stock', {
            p_product_id: item.productId,
            p_quantity: qty,
          });

          if (rpcErr) {
            const prod = prodsMap.get(item.productId);
            if (prod && !prod.is_unlimited_stock) {
              await supabase
                .from('products')
                .update({ stock: Math.max(0, (Number(prod.stock) || 0) - qty) })
                .eq('id', item.productId);
            }
          }
        })
      );
    }

    revalidatePath('/');
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

  if (order.buyer_id !== user.id && order.seller_id !== user.id) {
    return { error: 'No tienes permiso para cancelar este pedido.' };
  }

  if (order.status !== 'pendiente') {
    return { error: 'Solo se pueden eliminar o cancelar pedidos que están pendientes de validar.' };
  }

  // 2. Restaurar stock de los productos con RPC seguro
  if (order.order_items && order.order_items.length > 0) {
    for (const item of order.order_items) {
      const qty = Number(item.quantity) || 1;
      const { error: rpcErr } = await supabase.rpc('restore_product_stock', {
        p_product_id: item.product_id,
        p_quantity: qty,
      });

      if (rpcErr) {
        const { data: prod } = await supabase
          .from('products')
          .select('stock, is_unlimited_stock')
          .eq('id', item.product_id)
          .single();

        if (prod && !prod.is_unlimited_stock) {
          await supabase
            .from('products')
            .update({ stock: (Number(prod.stock) || 0) + qty })
            .eq('id', item.product_id);
        }
      }
    }
  }

  // 3. Eliminar líneas y pedido de la base de datos
  await supabase.from('order_items').delete().eq('order_id', orderId);
  const { error: delErr } = await supabase.from('orders').delete().eq('id', orderId);

  if (delErr) {
    return { error: delErr.message };
  }

  revalidatePath('/');
  revalidatePath('/cesta');
  revalidatePath('/comprador/pedidos');
  revalidatePath('/vendedor/pedidos');
  revalidatePath('/comprador/calendario');
  revalidatePath('/vendedor/calendario');

  return { success: true };
}

export async function saveBuyerAddresses(addresses: SavedAddress[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Debes iniciar sesión.' };

  const validAddresses = addresses.slice(0, 3);

  const { error } = await supabase
    .from('profiles')
    .update({ saved_addresses: validAddresses, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/cesta');
  revalidatePath('/perfil');
  return { success: true, addresses: validAddresses };
}