'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { sendMessage } from '@/app/actions/chat';
import type { Profile } from '@/types/database';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface ChatConversationViewProps {
  currentUserId: string;
  receiverId: string;
  recipient: Partial<Profile> | null;
  initialMessages: ChatMessage[];
}

export function ChatConversationView({
  currentUserId,
  receiverId,
  recipient,
  initialMessages,
}: ChatConversationViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    setMessages(initialMessages);
    scrollToBottom('auto');
  }, [initialMessages]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    if (!text || sending) return;

    const tempMsg: ChatMessage = {
      id: 'temp_' + Date.now(),
      sender_id: currentUserId,
      receiver_id: receiverId,
      message: text,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputMessage('');
    setSending(true);

    const formData = new FormData();
    formData.append('receiver_id', receiverId);
    formData.append('message', text);

    const res = await sendMessage(formData);
    setSending(false);

    if (res?.error) {
      alert('Error al enviar el mensaje: ' + res.error);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-[80vh] flex flex-col bg-white rounded-3xl border-2 border-stone-200 shadow-sm overflow-hidden">
      {/* Cabecera Chat */}
      <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center gap-3">
        <Link
          href="/chat"
          className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-600 transition-colors"
          title="Volver a todos los chats"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          {recipient?.avatar_url ? (
            <img
              src={recipient.avatar_url}
              alt={recipient.full_name || 'Usuario'}
              className="w-10 h-10 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center border border-emerald-300 shrink-0 shadow-sm">
              {recipient?.full_name?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <h2 className="font-black text-stone-900 text-sm">{recipient?.full_name || 'Usuario'}</h2>
            <p className="text-[11px] font-semibold text-stone-500 capitalize">
              {recipient?.role === 'vendedor' ? 'Caserío / Productor' : 'Comprador'} · {recipient?.town || 'Local'}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                    isMe
                      ? 'bg-emerald-800 text-white rounded-tr-none'
                      : 'bg-stone-100 text-stone-900 border border-stone-200 rounded-tl-none font-medium'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  <span
                    className={`text-[9px] font-bold block text-right mt-1 ${
                      isMe ? 'text-emerald-200' : 'text-stone-400'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
            <p className="text-xs font-semibold">No hay mensajes aún.</p>
            <p className="text-[11px] text-stone-400">¡Escribe el primer mensaje para iniciar la conversación!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Envío */}
      <form onSubmit={handleSend} className="p-3 border-t border-stone-200 bg-stone-50 flex gap-2">
        <input
          name="message"
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="flex-1 px-4 py-2.5 border-2 border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-none bg-white text-stone-900 shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || sending}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl transition-all font-black text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>
    </div>
  );
}
