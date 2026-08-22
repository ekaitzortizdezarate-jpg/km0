'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado.' };

  const full_name = formData.get('full_name') as string;
  const town = formData.get('town') as string;
  const postal_code = (formData.get('postal_code') as string) || null;
  const birth_date = (formData.get('birth_date') as string) || null;
  const dni = (formData.get('dni') as string) || null;
  const address_notes = (formData.get('address_notes') as string) || null;
  const role = (formData.get('role') as string) || undefined;
  const phone = (formData.get('phone') as string) || null;
  const address = (formData.get('address') as string) || null;
  const bio = (formData.get('bio') as string) || null;
  const avatar_url = (formData.get('avatar_url') as string) || null;

  // Guardar en user_metadata de Auth para máxima compatibilidad
  await supabase.auth.updateUser({
    data: {
      full_name,
      birth_date,
      dni,
      address_notes,
      phone,
      town,
      postal_code,
    },
  });

  const updateData: Record<string, any> = {
    full_name,
    town,
    postal_code,
    phone,
    address,
    bio,
    avatar_url,
  };

  if (birth_date) updateData.birth_date = birth_date;
  if (dni) updateData.dni = dni;
  if (address_notes) updateData.address_notes = address_notes;

  if (role) {
    updateData.role = role;
    if (role === 'vendedor') {
      updateData.seller_status = 'approved';
    }
  }

  let { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (error && (error.message.includes('column') || error.code === '42703')) {
    const basicUpdate: Record<string, any> = {
      full_name,
      town,
      postal_code,
      phone,
      address,
      bio,
      avatar_url,
    };
    if (role) {
      basicUpdate.role = role;
      if (role === 'vendedor') basicUpdate.seller_status = 'approved';
    }
    const retry = await supabase.from('profiles').update(basicUpdate).eq('id', user.id);
    error = retry.error;
  }

  if (error) return { error: error.message };

  revalidatePath('/perfil');
  revalidatePath('/');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function switchUserRole(newRole: 'comprador' | 'vendedor') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      role: newRole,
      seller_status: 'approved',
    })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  revalidatePath('/perfil');
  return { success: true, role: newRole };
}

export async function saveBuyerAddresses(addresses: { id: string; label: string; address: string; town?: string }[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado.' };

  const { error } = await supabase
    .from('profiles')
    .update({ saved_addresses: addresses })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/cesta');
  return { success: true };
}