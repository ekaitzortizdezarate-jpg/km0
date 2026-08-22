'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Procesa avatar_url:
 * Si es una imagen base64, intenta subirla a Supabase Storage (bucket 'avatars' o 'images')
 * para obtener una URL pública corta y evitar inflar las cookies de sesión.
 */
async function processAvatarUrl(
  supabase: any,
  rawAvatarUrl: string | null,
  userId: string
): Promise<string | null> {
  if (!rawAvatarUrl) return null;
  if (!rawAvatarUrl.startsWith('data:image/')) {
    return rawAvatarUrl;
  }

  try {
    const matches = rawAvatarUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const filename = `avatar_${userId}_${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filename, buffer, {
          contentType: `image/${matches[1]}`,
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filename);
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    }
  } catch (err) {
    console.warn('Supabase storage upload skipped/unavailable, using raw value for database:', err);
  }

  return rawAvatarUrl;
}

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
  const raw_avatar_url = (formData.get('avatar_url') as string) || null;

  // Procesar avatar de forma segura
  const avatar_url = await processAvatarUrl(supabase, raw_avatar_url, user.id);

  // 1. Guardar metadatos LIGEROS en Auth.
  // IMPORTANTE: NUNCA guardar base64 en user_metadata porque Supabase Auth lo serializa en el JWT Cookie
  // y excede el límite HTTP de cabeceras de Vercel (Error 494 REQUEST_HEADER_TOO_LARGE).
  const safeAuthMetadata: Record<string, any> = {
    full_name,
    birth_date,
    dni,
    address_notes,
    phone,
    town,
    postal_code,
  };

  // Solo guardamos avatar_url en user_metadata si es una URL corta HTTP(S) normal
  if (avatar_url && !avatar_url.startsWith('data:') && avatar_url.length < 500) {
    safeAuthMetadata.avatar_url = avatar_url;
  } else {
    // Si es base64 o null, limpiamos la propiedad del token JWT para reducir de inmediato las cookies
    safeAuthMetadata.avatar_url = null;
  }

  await supabase.auth.updateUser({
    data: safeAuthMetadata,
  });

  // 2. Columnas base que se guardan en la tabla 'profiles' de la BD Postgres
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