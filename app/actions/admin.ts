'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { SellerStatus } from '@/types/database';

export async function updateSellerStatus(sellerId: string, status: SellerStatus) {
  const supabase = await createClient();

  // Validar rol de administrador
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado.' };
  }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminProfile?.role !== 'admin') {
    return { error: 'Permisos insuficientes.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ seller_status: status })
    .eq('id', sellerId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin');
  return { success: true };
}