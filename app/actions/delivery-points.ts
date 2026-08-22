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
  const postal_code = (formData.get('postal_code') as string) || '';
  const address_details = formData.get('address_details') as string;
  const days_of_week = formData.getAll('days_of_week') as string[];
  const opening_time = (formData.get('opening_time') as string) || '';
  const closing_time = (formData.get('closing_time') as string) || '';

  // Formatear notas de horario
  let schedule_notes = formData.get('schedule_notes') as string;
  if (!schedule_notes && (days_of_week.length > 0 || (opening_time && closing_time))) {
    const daysStr = days_of_week.join(', ');
    const hoursStr = opening_time && closing_time ? `de ${opening_time} a ${closing_time}` : '';
    schedule_notes = [daysStr, hoursStr].filter(Boolean).join(' ');
  }

  // Regla: En modalidad 'caserio', solo puede existir 1 dirección guardada.
  if (type === 'caserio') {
    const { data: existingCaserio } = await supabase
      .from('delivery_points')
      .select('id')
      .eq('seller_id', user.id)
      .eq('type', 'caserio')
      .maybeSingle();

    if (existingCaserio) {
      // Actualizar la dirección de caserío existente
      const { error: updateErr } = await supabase
        .from('delivery_points')
        .update({
          name: name || 'Caserío',
          town,
          postal_code,
          address_details,
          days_of_week,
          opening_time,
          closing_time,
          schedule_notes: schedule_notes || null,
          is_active: true,
        })
        .eq('id', existingCaserio.id);

      if (updateErr) return { error: updateErr.message };

      revalidatePath('/vendedor/puntos-entrega');
      return { success: true, updated: true };
    }
  }

  const { error } = await supabase.from('delivery_points').insert({
    seller_id: user.id,
    name,
    type,
    town,
    postal_code,
    address_details,
    days_of_week,
    opening_time,
    closing_time,
    schedule_notes: schedule_notes || null,
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

export async function toggleHomeDeliveryService(enabled: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('town, address')
    .eq('id', user.id)
    .single();

  const { data: existingEnvio } = await supabase
    .from('delivery_points')
    .select('id, is_active')
    .eq('seller_id', user.id)
    .eq('type', 'envio')
    .maybeSingle();

  if (existingEnvio) {
    const { error } = await supabase
      .from('delivery_points')
      .update({ is_active: enabled })
      .eq('id', existingEnvio.id);

    if (error) return { error: error.message };
  } else if (enabled) {
    const { error } = await supabase.from('delivery_points').insert({
      seller_id: user.id,
      name: 'Servicio de Envío a Domicilio',
      type: 'envio',
      town: profile?.town || 'Reparto local',
      address_details: 'Reparto directo a la dirección del comprador',
      schedule_notes: 'Entrega en el domicilio del cliente',
      is_active: true,
    });

    if (error) return { error: error.message };
  }

  revalidatePath('/vendedor/puntos-entrega');
  return { success: true, enabled };
}