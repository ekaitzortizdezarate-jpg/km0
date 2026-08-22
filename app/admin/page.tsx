import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { updateSellerStatus } from '@/app/actions/admin';
import { ShieldCheck, CheckCircle2, XCircle, Clock, MapPin, Phone } from 'lucide-react';
import type { Profile } from '@/types/database';

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verificar que el usuario tenga rol 'admin'
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  // Obtener vendedores pendientes y lista general
  const { data: pendingSellers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'vendedor')
    .eq('seller_status', 'pending')
    .order('created_at', { ascending: false });

  const { data: approvedSellers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'vendedor')
    .eq('seller_status', 'approved')
    .order('full_name', { ascending: true });

  return (
    <div className="space-y-8">
      {/* Cabecera del Panel */}
      <div className="flex items-center gap-3 bg-stone-900 text-white p-6 rounded-2xl shadow-sm">
        <div className="p-3 bg-stone-800 rounded-xl">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Panel de Administración km0</h1>
          <p className="text-stone-400 text-xs mt-0.5">
            Validación de productores y control general de la plataforma
          </p>
        </div>
      </div>

      {/* Vendedores Pendientes de Validación */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-stone-900">
            Caseríos pendientes de aprobación ({pendingSellers?.length || 0})
          </h2>
        </div>

        {pendingSellers && pendingSellers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingSellers.map((seller: Profile) => (
              <div
                key={seller.id}
                className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {seller.avatar_url ? (
                      <img
                        src={seller.avatar_url}
                        alt={seller.full_name || 'Vendedor'}
                        className="w-10 h-10 rounded-full object-cover border border-amber-300 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center border border-amber-300 shrink-0">
                        {seller.full_name?.charAt(0) || 'V'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-stone-900 text-base">
                        {seller.full_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{seller.town}</span>
                        {seller.phone && (
                          <>
                            <span className="text-stone-300">·</span>
                            <Phone className="w-3.5 h-3.5" />
                            <span>{seller.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-1 rounded">
                    Pendiente
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                  <form
                    action={async () => {
                      'use server';
                      await updateSellerStatus(seller.id, 'approved');
                    }}
                    className="flex-1"
                  >
                    <button
                      type="submit"
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aprobar
                    </button>
                  </form>

                  <form
                    action={async () => {
                      'use server';
                      await updateSellerStatus(seller.id, 'rejected');
                    }}
                    className="flex-1"
                  >
                    <button
                      type="submit"
                      className="w-full bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-700 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Rechazar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-white border border-stone-200 rounded-xl text-center text-sm text-stone-500">
            No hay solicitudes pendientes de validación.
          </div>
        )}
      </div>

      {/* Caseríos Aprobados y Activos */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-stone-900">
          Caseríos Activos ({approvedSellers?.length || 0})
        </h2>

        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-50 text-xs font-semibold text-stone-700 uppercase border-b border-stone-200">
                <tr>
                  <th className="px-5 py-3">Nombre / Caserío</th>
                  <th className="px-5 py-3">Pueblo</th>
                  <th className="px-5 py-3">Teléfono</th>
                  <th className="px-5 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {approvedSellers?.map((seller: Profile) => (
                  <tr key={seller.id} className="hover:bg-stone-50/50">
                    <td className="px-5 py-3.5 font-medium text-stone-900">
                      <div className="flex items-center gap-2.5">
                        {seller.avatar_url ? (
                          <img
                            src={seller.avatar_url}
                            alt={seller.full_name || 'Vendedor'}
                            className="w-7 h-7 rounded-full object-cover border border-stone-200 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] flex items-center justify-center border border-emerald-300 shrink-0">
                            {seller.full_name?.charAt(0) || 'V'}
                          </div>
                        )}
                        <span>{seller.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{seller.town}</td>
                    <td className="px-5 py-3.5">{seller.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Verificado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}