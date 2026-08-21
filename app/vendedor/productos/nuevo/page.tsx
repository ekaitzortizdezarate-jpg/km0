'use client';

import { useState } from 'react';
import { createProduct } from '@/app/actions/products';
import { Sprout, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProductPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await createProduct(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al catálogo
      </Link>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900">Publicar Producto</h1>
            <p className="text-xs text-stone-500">
              Añade un producto o cesta de tu caserío al catálogo
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Nombre del Producto *
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Ej. Pimientos de Gernika, Tomate de caserío, Queso Idiazabal..."
              className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Categoría y Formato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Familia / Categoría *
              </label>
              <select
                name="category"
                required
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="verduras_hortalizas">Verduras y Hortalizas</option>
                <option value="frutas">Frutas</option>
                <option value="quesos_lacteos">Quesos y Lácteos</option>
                <option value="bebidas">Bebidas (Txakoli / Vino)</option>
                <option value="otros_alimentos">Otros Alimentos (Miel / Conservas)</option>
                <option value="plantas_flores">Plantas y Flores</option>
                <option value="articulos_diversos">Artículos Diversos</option>
                <option value="artesania">Artesanía Local</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Formato *
              </label>
              <select
                name="format"
                required
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="suelto">Producto Suelto</option>
                <option value="pack_cesta">Pack / Cesta variada</option>
              </select>
            </div>
          </div>

          {/* Precios y Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Precio Total (€) *
              </label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Precio / Kilo (€)
              </label>
              <input
                name="price_per_kilo"
                type="number"
                step="0.01"
                min="0"
                placeholder="Opcional"
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Stock disponible *
              </label>
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue="10"
                required
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Peso y Descuento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Peso (Gramos)
              </label>
              <input
                name="weight_grams"
                type="number"
                min="0"
                placeholder="Ej. 500"
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Descuento (%)
              </label>
              <input
                name="discount_percentage"
                type="number"
                min="0"
                max="100"
                defaultValue="0"
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Consumo preferente
              </label>
              <input
                name="best_before_date"
                type="date"
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Cultivo y Certificación Ecológica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Tipo de Cultivo
              </label>
              <select
                name="cultivation"
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="no_aplica">No aplica</option>
                <option value="exterior">Cultivo Exterior / Aire Libre</option>
                <option value="invernadero">Invernadero</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                name="is_organic"
                type="checkbox"
                id="is_organic"
                className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <label htmlFor="is_organic" className="text-sm font-medium text-stone-800">
                Certificado / Producto Ecológico
              </label>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Descripción o notas de cosecha
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Detalles sobre la recogida, maduración o características especiales..."
              className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Botón Envío */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Guardando producto...' : 'Publicar Producto en km0'}
          </button>
        </form>
      </div>
    </div>
  );
}