import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, User, ArrowLeft, Clock, Store, ShieldCheck } from 'lucide-react';
import type { Profile } from '@/types/database';

interface ConversationSummary {
  otherUser: Profile;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default async function ChatInboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Obtener todos los mensajes donde el usuario participe
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  // Agrupar por interlocutor
  const conversationsMap = new Map<string, { lastMsg: string; lastTime: string; unread: number }>();

  if (messages && messages.length > 0) {
    messages.forEach((msg) => {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!conversationsMap.has(otherId)) {
        conversationsMap.set(otherId, {
          lastMsg: msg.message,
          lastTime: msg.created_at,
          unread: 0,
        });
      }
      // Contar no leídos recibidos
      if (msg.receiver_id === user.id && !msg.is_read) {
        const entry = conversationsMap.get(otherId)!;
        entry.unread += 1;
      }
    });
  }

  const otherIds = Array.from(conversationsMap.keys());
  let profiles: Profile[] = [];

  if (otherIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('*')
      .in('id', otherIds);

    if (profs) {
      profiles = profs as Profile[];
    }
  }

  const conversations: ConversationSummary[] = otherIds
    .map((id) => {
      const prof = profiles.find((p) => p.id === id);
      const convData = conversationsMap.get(id);
      if (!prof || !convData) return null;
      return {
        otherUser: prof,
        lastMessage: convData.lastMsg,
        lastMessageTime: convData.lastTime,
        unreadCount: convData.unread,
      };
    })
    .filter(Boolean) as ConversationSummary[];

  // Ordenar por fecha del último mensaje
  conversations.sort(
    (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </Link>
      </div>

      <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b-2 border-stone-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-stone-900">Mis Mensajes y Chats</h1>
              <p className="text-xs font-semibold text-stone-600">
                Conversaciones directas entre caseríos y compradores
              </p>
            </div>
          </div>

          <span className="text-xs font-extrabold bg-stone-100 text-stone-800 px-3 py-1 rounded-full border border-stone-200">
            {conversations.length} {conversations.length === 1 ? 'conversación' : 'conversaciones'}
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {conversations.length > 0 ? (
            conversations.map((conv) => {
              const { otherUser, lastMessage, lastMessageTime, unreadCount } = conv;
              const isSeller = otherUser.role === 'vendedor';

              return (
                <Link
                  key={otherUser.id}
                  href={`/chat/${otherUser.id}`}
                  className={`p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-stone-50 transition-colors ${
                    unreadCount > 0 ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      {otherUser.avatar_url ? (
                        <img
                          src={otherUser.avatar_url}
                          alt={otherUser.full_name}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-base flex items-center justify-center border-2 border-emerald-300">
                          {otherUser.full_name?.charAt(0) || 'U'}
                        </div>
                      )}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-stone-950 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black text-stone-900 truncate">
                          {otherUser.full_name}
                        </h2>
                        {isSeller ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-950 px-2 py-0.2 rounded-md">
                            <Store className="w-3 h-3 text-emerald-700" /> Caserío
                          </span>
                        ) : otherUser.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-stone-200 text-stone-900 px-2 py-0.2 rounded-md">
                            <ShieldCheck className="w-3 h-3 text-stone-700" /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-stone-100 text-stone-700 px-2 py-0.2 rounded-md">
                            <User className="w-3 h-3 text-stone-500" /> Comprador
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] font-semibold text-stone-500 mt-0.5">
                        {otherUser.town}
                      </p>

                      <p className="text-xs font-medium text-stone-700 truncate mt-1 max-w-md">
                        {lastMessage}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {new Date(lastMessageTime).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>

                    {unreadCount > 0 && (
                      <span className="bg-amber-400 text-stone-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                        {unreadCount} nuevo{unreadCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="text-center py-16 p-6 space-y-3">
              <MessageCircle className="w-12 h-12 text-stone-300 mx-auto" />
              <h2 className="text-base font-bold text-stone-700">Aún no tienes conversaciones abiertas</h2>
              <p className="text-xs font-medium text-stone-500 max-w-sm mx-auto">
                Puedes enviar un mensaje a cualquier caserío desde el catálogo de productos o desde los detalles de tus pedidos.
              </p>
              <Link
                href="/"
                className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                Explorar el Catálogo
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
