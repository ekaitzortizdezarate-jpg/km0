'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data?.user) {
    // Verificar si el usuario tiene fila en profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', data.user.id)
      .maybeSingle();

    const metaRole = data.user.user_metadata?.role || 'comprador';
    const metaFullName = data.user.user_metadata?.full_name || email.split('@')[0];
    const metaTown = data.user.user_metadata?.town || 'Local';
    const metaPhone = data.user.user_metadata?.phone || null;
    const metaAddress = data.user.user_metadata?.address || null;

    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        role: metaRole,
        full_name: metaFullName,
        town: metaTown,
        phone: metaPhone,
        address: metaAddress,
        seller_status: 'approved',
      });
    }
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
    await supabase.from('profiles').upsert({
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