import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createDeliveryPoint, deleteDeliveryPoint } from '@/app/actions/delivery-points';
import { MapPin, Plus, Trash2, Store, Truck, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import type { DeliveryPoint } from '@/types/database';

export default async function DeliveryPointsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, seller_status')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'vendedor') {
    redirect('/');
  }

  const { data: points } = await supabase
    .from('delivery_points')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="flex items-center justify-between">
        <Link
          href="/vendedor/pedidos"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a mis pedidos
        </Link>
      </div>

      <div className="flex items-center gap-3 bg-stone-900 text-white p-6 rounded-2xl shadow-sm">
        <div className="p-3 bg-stone-800 rounded-xl text-emerald-400">
          <Store className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Puntos de Entrega y Recogida</h1>
          <p className="text-stone-400 text-xs mt-0.5">
            Configura los lugares donde tus clientes pueden recoger sus pedidos de caserío
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulario para añadir punto de entrega */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Plus className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm font-bold text-stone-900">Añadir Nuevo Punto</h2>
          </div>

          <form
            action={async (formData: FormData) => {
              'use server';
              await createDeliveryPoint(formData);
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nombre del punto *
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="Ej. Mercado de Gernika, Caserío..."
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tipo de entrega *
              </label>
              <select
                name="type"
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="sitio_fisico">Punto Físico / Recogida</option>
                <option value="envio">Ruta de Reparto / Envío</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Pueblo / Municipio *
              </label>
              <input
                name="town"
                type="text"
                required
                placeholder="Ej. Gernika-Lumo"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Dirección / Ubicación exacta *
              </label>
              <input
                name="address_details"
                type="text"
                required
                placeholder="Ej. Puesto 12, Plaza del Mercado"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Horarios / Días de entrega
              </label>
              <textarea
                name="schedule_notes"
                rows={2}
                placeholder="Ej. Lunes de 09:00 a 14:00"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Guardar Punto
            </button>
          </form>
        </div>

        {/* Lista de puntos de entrega */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-stone-900">
            Tus Puntos Configurados ({points?.length || 0})
          </h2>

          {points && points.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {points.map((point: DeliveryPoint) => (
                <div
                  key={point.id}
                  className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{point.name}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full capitalize">
                        {point.type === 'sitio_fisico' ? (
                          <>
                            <Store className="w-3 h-3" /> Recogida
                          </>
                        ) : (
                          <>
                            <Truck className="w-3 h-3" /> Reparto
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-stone-600">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>
                        {point.address_details} ({point.town})
                      </span>
                    </div>

                    {point.schedule_notes && (
                      <div className="flex items-center gap-1.5 text-xs text-stone-500">
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{point.schedule_notes}</span>
                      </div>
                    )}
                  </div>

                  <form
                    action={async () => {
                      'use server';
                      await deleteDeliveryPoint(point.id);
                    }}
                  >
                    <button
                      type="submit"
                      title="Eliminar punto"
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-white border border-stone-200 rounded-xl text-center text-xs text-stone-500 space-y-1">
              <p className="font-semibold text-stone-700">No tienes puntos de entrega configurados.</p>
              <p>Añade los lugares donde tus clientes podrán recoger los pedidos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
