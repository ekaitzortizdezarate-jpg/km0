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

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .eq('seller_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/vendedor/pedidos');
  revalidatePath('/comprador/pedidos');
  revalidatePath('/vendedor/calendario');
  revalidatePath('/comprador/calendario');
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
  return { success: true };
}