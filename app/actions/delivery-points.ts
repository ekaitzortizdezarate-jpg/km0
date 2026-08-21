'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { DeliveryType } from '@/types/database';

export async function createDeliveryPoint(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado.' };

  const name = formData.get('name') as string;
  const type = (formData.get('type') as DeliveryType) || 'sitio_fisico';
  const town = formData.get('town') as string;
  const address_details = formData.get('address_details') as string;
  const schedule_notes = (formData.get('schedule_notes') as string) || null;

  const { error } = await supabase.from('delivery_points').insert({
    seller_id: user.id,
    name,
    type,
    town,
    address_details,
    schedule_notes,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath('/vendedor/puntos-entrega');
  return { success: true };
}

export async function deleteDeliveryPoint(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('delivery_points').delete().eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/vendedor/puntos-entrega');
  return { success: true };
}