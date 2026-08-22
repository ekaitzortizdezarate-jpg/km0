'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const full_name = formData.get('full_name') as string;
  const role = (formData.get('role') as string) || 'comprador';
  const town = formData.get('town') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role,
        town,
        phone,
        address,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data?.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      role,
      full_name,
      town,
      phone: phone || null,
      address: address || null,
      seller_status: 'approved',
    });
  }

  revalidatePath('/', 'layout');
  redirect('/login?registered=true');
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: 'No autorizado.' };
  }

  const currentPassword = formData.get('current_password') as string;
  const newPassword = formData.get('new_password') as string;
  const confirmPassword = formData.get('confirm_password') as string;

  if (!currentPassword) {
    return { error: 'Debes introducir tu contraseña actual.' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' };
  }

  // 1. Verificar la contraseña actual iniciando sesión
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: 'La contraseña actual no es correcta.' };
  }

  // 2. Actualizar a la nueva contraseña
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}