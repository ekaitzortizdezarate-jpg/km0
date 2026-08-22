'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signup } from '@/app/actions/auth';
import { UserPlus, AlertCircle, ShoppingBag, Sprout } from 'lucide-react';
import { LocationSelector } from '@/components/LocationSelector';

export default function RegisterPage() {
  const [role, setRole] = useState<'comprador' | 'vendedor'>('comprador');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append('role', role);

    const result = await signup(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex items-start justify-center px-4 pt-2 sm:pt-4 pb-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border-2 border-stone-200 p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Crear cuenta en km0</h1>
          <p className="text-sm text-stone-600 mt-1">
            Conecta directamente con productores locales
          </p>
        </div>

        {/* Selector de Rol */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole('comprador')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-sm ${
              role === 'comprador'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                : 'border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <ShoppingBag className="w-5 h-5 text-emerald-700" />
            Comprador
          </button>
          <button
            type="button"
            onClick={() => setRole('vendedor')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-sm ${
              role === 'vendedor'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                : 'border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Sprout className="w-5 h-5 text-emerald-700" />
            Productor / Caserío
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Nombre completo o Nombre del Caserío
            </label>
            <input
              name="full_name"
              type="text"
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-stone-900 bg-white"
              placeholder="Ej. Ane / Caserío Goikoetxea"
            />
          </div>

          <LocationSelector
            defaultProvince="Bizkaia"
            showProvince={true}
            showPostalCode={false}
            required={true}
            labelTown="Pueblo / Municipio *"
            labelProvince="Provincia"
          />

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Teléfono de contacto
            </label>
            <input
              name="phone"
              type="tel"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-stone-900 bg-white"
              placeholder="600 000 000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Correo Electrónico
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-stone-900 bg-white"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-stone-900 bg-white"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {role === 'vendedor' && (
            <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              * Las cuentas de caserío y productor requieren validación por parte del administrador antes de publicar productos.
            </p>
          )}

          <label className="flex items-start gap-2.5 text-xs text-stone-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              required
              className="mt-0.5 w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
            />
            <span>
              He leído y acepto los{' '}
              <Link href="/terminos" target="_blank" className="font-bold text-emerald-800 underline">
                Términos de Uso
              </Link>{' '}
              y la{' '}
              <Link href="/privacidad" target="_blank" className="font-bold text-emerald-800 underline">
                Política de Privacidad
              </Link>.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : (
              <>
                <UserPlus className="w-4 h-4" /> Registrarme
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-stone-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}