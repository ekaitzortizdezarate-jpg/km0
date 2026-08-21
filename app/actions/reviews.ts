'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function submitReview(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autorizado.' };

  const target_id = formData.get('target_id') as string;
  const order_id = (formData.get('order_id') as string) || null;
  const rating = parseInt(formData.get('rating') as string, 10);
  const comment = (formData.get('comment') as string) || null;
  const is_anonymous = formData.get('is_anonymous') === 'on';

  if (comment && comment.length > 50) {
    return { error: 'El comentario no puede superar los 50 caracteres.' };
  }

  const { error } = await supabase.from('reviews').insert({
    reviewer_id: user.id,
    target_id,
    order_id,
    rating,
    comment,
    is_anonymous,
  });

  if (error) return { error: error.message };

  revalidatePath('/comprador/pedidos');
  revalidatePath('/vendedor/pedidos');
  return { success: true };
}