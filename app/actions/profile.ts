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

  // 1. Guardar en user_metadata de Auth (SIEMPRE funciona en Supabase Auth y persiste todos los campos)
  await supabase.auth.updateUser({
    data: {
      full_name,
      birth_date,
      dni,
      address_notes,
      phone,
      town,
      postal_code,
      bio,
      avatar_url,
    },
  });

  // 2. Columnas base que siempre existen en la tabla profiles
  const safeBaseUpdate: Record<string, any> = {
    full_name,
    town,
    phone,
    address,
    bio,
    avatar_url,
  };

  if (role) {
    safeBaseUpdate.role = role;
    if (role === 'vendedor') {
      safeBaseUpdate.seller_status = 'approved';
    }
  }

  // Intentar primero con todas las columnas
  const extendedUpdate: Record<string, any> = {
    ...safeBaseUpdate,
  };
  if (postal_code) extendedUpdate.postal_code = postal_code;
  if (birth_date) extendedUpdate.birth_date = birth_date;
  if (dni) extendedUpdate.dni = dni;
  if (address_notes) extendedUpdate.address_notes = address_notes;

  let { error } = await supabase
    .from('profiles')
    .update(extendedUpdate)
    .eq('id', user.id);

  // Si da error de columna o schema cache (ej. postal_code, dni, etc. no existen en la tabla)
  if (error) {
    const fallbackRes = await supabase
      .from('profiles')
      .update(safeBaseUpdate)
      .eq('id', user.id);
    error = fallbackRes.error;
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