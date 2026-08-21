'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function sendMessage(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'No autenticado.' };

  const receiver_id = formData.get('receiver_id') as string;
  const message = formData.get('message') as string;

  if (!message || message.trim() === '') {
    return { error: 'El mensaje no puede estar vacío.' };
  }

  const { error } = await supabase.from('chat_messages').insert({
    sender_id: user.id,
    receiver_id,
    message,
    is_read: false,
  });

  if (error) return { error: error.message };

  revalidatePath(`/chat/${receiver_id}`);
  return { success: true };
}