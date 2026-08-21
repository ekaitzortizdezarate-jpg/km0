'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado.' };

  const full_name = formData.get('full_name') as string;
  const town = formData.get('town') as string;
  const phone = (formData.get('phone') as string) || null;
  const address = (formData.get('address') as string) || null;
  const bio = (formData.get('bio') as string) || null;
  const avatar_url = (formData.get('avatar_url') as string) || null;

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, town, phone, address, bio, avatar_url })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/perfil');
  revalidatePath('/');
  return { success: true };
}