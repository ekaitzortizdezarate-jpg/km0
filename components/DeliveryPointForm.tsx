'use client';

import { useState } from 'react';
import { createDeliveryPoint } from '@/app/actions/delivery-points';
import { Plus, AlertCircle } from 'lucide-react';

export function DeliveryPointForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createDeliveryPoint(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      form.reset();
    }
    setLoading(false);
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
        <Plus className="w-5 h-5 text-emerald-700" />
        <h2 className="text-sm font-bold text-stone-900">Añadir Nuevo Punto</h2>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Nombre del punto *
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="Ej. Mercado de Gernika, Caserío..."
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white text-stone-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Tipo de entrega *
          </label>
          <select
            name="type"
            required
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none text-stone-900"
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
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white text-stone-900"
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
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white text-stone-900"
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
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white text-stone-900"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> {loading ? 'Guardando...' : 'Guardar Punto'}
        </button>
      </form>
    </div>
  );
}

export default DeliveryPointForm;
