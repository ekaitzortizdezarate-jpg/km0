import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChatConversationView } from '@/components/ChatConversationView';

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ receiverId: string }>;
}) {
  const { receiverId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Marcar como leídos los mensajes recibidos de esta persona
  await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('receiver_id', user.id)
    .eq('sender_id', receiverId)
    .eq('is_read', false);

  const [recipientRes, messagesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, town, role, avatar_url')
      .eq('id', receiverId)
      .single(),
    supabase
      .from('chat_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true }),
  ]);

  return (
    <div className="py-2">
      <ChatConversationView
        currentUserId={user.id}
        receiverId={receiverId}
        recipient={recipientRes.data}
        initialMessages={messagesRes.data || []}
      />
    </div>
  );
}