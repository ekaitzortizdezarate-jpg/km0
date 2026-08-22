import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { sendMessage } from '@/app/actions/chat';
import { Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ receiverId: string }>;
}) {
  const { receiverId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Marcar como leídos los mensajes recibidos de esta persona
  await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('receiver_id', user.id)
    .eq('sender_id', receiverId)
    .eq('is_read', false);

  const { data: recipient } = await supabase
    .from('profiles')
    .select('full_name, town, role, avatar_url')
    .eq('id', receiverId)
    .single();

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true });

  return (
    <div className="max-w-2xl mx-auto h-[80vh] flex flex-col bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Cabecera Chat */}
      <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center gap-3">
        <Link href="/chat" className="text-stone-500 hover:text-stone-900" title="Volver a todos los chats">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2.5">
          {recipient?.avatar_url ? (
            <img
              src={recipient.avatar_url}
              alt={recipient.full_name || 'Usuario'}
              className="w-9 h-9 rounded-full object-cover border border-stone-200 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-300 shrink-0">
              {recipient?.full_name?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <h2 className="font-bold text-stone-900 text-sm">{recipient?.full_name || 'Usuario'}</h2>
            <p className="text-[10px] text-stone-500 capitalize">{recipient?.role} · {recipient?.town}</p>
          </div>
        </div>
      </div>

      {/* Lista de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages && messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-xs shadow-sm ${
                  isMe ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-800'
                }`}>
                  <p>{msg.message}</p>
                  <span className={`text-[9px] block text-right mt-1 ${isMe ? 'text-emerald-200' : 'text-stone-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-xs text-stone-400">
            No hay mensajes aún. ¡Inicia la conversación!
          </div>
        )}
      </div>

      {/* Input de Envío */}
      <form
        action={async (formData: FormData) => {
          'use server';
          await sendMessage(formData);
        }}
        className="p-3 border-t border-stone-200 bg-stone-50 flex gap-2"
      >
        <input type="hidden" name="receiver_id" value={receiverId} />
        <input
          name="message"
          type="text"
          required
          placeholder="Escribe tu mensaje..."
          className="flex-1 px-3.5 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
        />
        <button
          type="submit"
          className="bg-emerald-700 hover:bg-emerald-800 text-white p-2 rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}