import Link from 'next/link';
import { ArrowLeft, Sprout, MapPin, User } from 'lucide-react';
import { ProductForm } from '@/components/ProductForm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Product } from '@/types/database';
import { validateProfileCompleteness } from '@/lib/profile-validation';

export default async function NewProductPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 1. Comprobar que el vendedor tiene el perfil completo con todos los campos obligatorios
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const profileValidation = validateProfileCompleteness(profile);
  if (!profileValidation.isComplete) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </Link>

        <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 sm:p-8 space-y-5 text-center shadow-md">
          <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <User className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100 rounded-full mb-2 border border-amber-200">
              Paso previo requerido
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">
              Completa los datos de tu cuenta
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-stone-600 max-w-md mx-auto mt-2 leading-relaxed">
              Para poder publicar productos, es obligatorio completar los datos de tu cuenta (nombre, apellido 1, fecha de nacimiento, DNI, teléfono y dirección completa).
            </p>

            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-left text-xs font-bold text-amber-950">
              <span className="block mb-1 font-black text-amber-900">Campos pendientes:</span>
              <ul className="list-disc list-inside space-y-0.5 text-amber-900">
                {profileValidation.missingFields.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/perfil"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all border border-emerald-950 hover:scale-[1.01]"
            >
              <User className="w-4 h-4 text-emerald-300" />
              <span>Completar datos de mi cuenta</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Comprobar si el vendedor tiene al menos un punto de entrega registrado
  const { count: pointsCount } = await supabase
    .from('delivery_points')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id);

  // Obtener productos previos del vendedor para autocompletado / sugerencias
  const { data: rawExisting } = await supabase
    .from('products')
    .select('id, name, category, format, price, price_per_kilo, is_organic, cultivation, image_url')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  const existingProducts = rawExisting as unknown as Product[] | null;

  if (!pointsCount || pointsCount === 0) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </Link>

        <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 sm:p-8 space-y-5 text-center shadow-md">
          <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <MapPin className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100 rounded-full mb-2 border border-amber-200">
              Paso previo requerido
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">
              Añade tus Sitios y Puntos de Entrega
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-stone-600 max-w-md mx-auto mt-2 leading-relaxed">
              Para poder publicar tus productos, primero debes registrar al menos una ubicación de entrega (tu caserío, un puesto en el mercado o entrega a domicilio) para que los compradores sepan dónde y cuándo recoger sus pedidos.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/vendedor/puntos-entrega"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all border border-emerald-950 hover:scale-[1.01]"
            >
              <MapPin className="w-4 h-4 text-emerald-300" />
              <span>Añadir Sitios y Puntos de Entrega</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 mb-6 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al catálogo
      </Link>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-800">
            <Sprout className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900">Publicar Producto</h1>
            <p className="text-xs font-medium text-stone-600">
              Añade un producto a peso, suelto o pack con sus condiciones de entrega
            </p>
          </div>
        </div>

        <ProductForm isEdit={false} existingProducts={existingProducts || []} />
      </div>
    </div>
  );
}