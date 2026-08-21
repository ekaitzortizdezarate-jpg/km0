import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createDeliveryPoint, deleteDeliveryPoint } from '@/app/actions/delivery-points';
import { Plus, Trash2, Store, Truck } from 'lucide-react';
import type { DeliveryPoint } from '@/types/database';

export default async function DeliveryPointsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: points } = await supabase
    .from('delivery_points')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Puntos de Entrega y Venta</h1>
        <p className="text-xs text-stone-500 mt-1">
          Configura los sitios físicos donde tus compradores recogerán sus pedidos o zonas de reparto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulario de Creación */}
        <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm h-fit">
          <h2 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-700" /> Añadir Punto
          </h2>
          <form
  action={async (formData: FormData) => {
    'use server';
    await createDeliveryPoint(formData);
  }}
  className="space-y-4"
>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nombre</label>
              <input
                name="name"
                type="text"
                required
                placeholder="Ej. Frontón Municipal, Puesto Caserío..."
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Tipo</label>
              <select name="type" className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white">
                <option value="sitio_fisico">Punto Físico / Recogida</option>
                <option value="envio">Zona de Reparto</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Pueblo</label>
              <input
                name="town"
                type="text"
                required
                placeholder="Ej. Gernika, Bermeo..."
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Dirección / Indicaciones</label>
              <textarea
                name="address_details"
                required
                rows={2}
                placeholder="Calle, plaza o referencia exacta..."
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Horarios y Notas</label>
              <input
                name="schedule_notes"
                type="text"
                placeholder="Ej. Sábados de 9:00 a 14:00"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2 rounded-lg text-xs transition-colors"
            >
              Guardar Punto
            </button>
          </form>
        </div>

        {/* Lista de Puntos */}
        <div className="md:col-span-2 space-y-4">
          {points && points.length > 0 ? (
            points.map((pt: DeliveryPoint) => (
              <div key={pt.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-50 text-emerald-800 rounded-md">
                      {pt.type === 'sitio_fisico' ? <Store className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                    </span>
                    <h3 className="font-bold text-stone-900 text-sm">{pt.name}</h3>
                    <span className="text-[10px] uppercase font-semibold bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                      {pt.town}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 pl-8">{pt.address_details}</p>
                  {pt.schedule_notes && (
                    <p className="text-[11px] text-amber-800 pl-8 font-medium">🕒 {pt.schedule_notes}</p>
                  )}
                </div>

                <form action={async () => {
                  'use server';
                  await deleteDeliveryPoint(pt.id);
                }}>
                  <button type="submit" title="Eliminar punto" className="p-2 text-stone-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 text-xs text-stone-500">
              Aún no has registrado ningún punto de entrega.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}