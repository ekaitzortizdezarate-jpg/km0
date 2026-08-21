import { createClient } from '@/lib/supabase/server';
import { ProductCategory, ProductWithSeller } from '@/types/database';
import { Leaf, Sun, Warehouse, Tag, Search } from 'lucide-react';
import Link from 'next/link';

interface SearchParams {
  category?: ProductCategory;
  organic?: string;
  town?: string;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Consulta dinámica con filtros
  let query = supabase
    .from('products')
    .select('*, profiles!products_seller_id_fkey(full_name, town)')
    .eq('is_active', true);

  if (params.category) {
    query = query.eq('category', params.category);
  }
  if (params.organic === 'true') {
    query = query.eq('is_organic', true);
  }
  if (params.town) {
    query = query.ilike('profiles.town', `%${params.town}%`);
  }

  const { data: rawProducts } = await query.order('created_at', { ascending: false });
  const products = rawProducts as unknown as ProductWithSeller[] | null;

  const categories: { label: string; value: ProductCategory }[] = [
    { label: 'Verduras y Hortalizas', value: 'verduras_hortalizas' },
    { label: 'Frutas', value: 'frutas' },
    { label: 'Quesos y Lácteos', value: 'quesos_lacteos' },
    { label: 'Bebidas y Txakoli', value: 'bebidas' },
    { label: 'Otros Alimentos', value: 'otros_alimentos' },
    { label: 'Plantas y Flores', value: 'plantas_flores' },
    { label: 'Artesanía', value: 'artesania' },
  ];

  return (
    <div className="space-y-8">
      {/* Banner Promocional */}
      <div className="bg-emerald-800 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="bg-emerald-700/80 text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Directo del Caserío
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Alimentos frescos de temporada cerca de ti.
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base">
            Conecta directamente con productores locales sin intermediarios.
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              !params.category
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            Todos
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.value}
              href={`/?category=${cat.value}${params.organic ? '&organic=true' : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                params.category === cat.value
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-stone-100 text-sm text-stone-600">
          <Link
            href={`/?${params.category ? `category=${params.category}&` : ''}${
              params.organic === 'true' ? '' : 'organic=true'
            }${params.town ? `&town=${encodeURIComponent(params.town)}` : ''}`}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
              params.organic === 'true'
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                : 'border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            Solo Ecológico
          </Link>

          <form method="GET" action="/" className="flex items-center gap-2">
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.organic && <input type="hidden" name="organic" value={params.organic} />}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                name="town"
                defaultValue={params.town || ''}
                placeholder="Buscar por municipio..."
                className="pl-8 pr-3 py-1 text-xs border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <button
              type="submit"
              className="text-xs bg-stone-800 hover:bg-black text-white px-2.5 py-1 rounded-lg transition-colors"
            >
              Buscar
            </button>
            {params.town && (
              <Link
                href={`/?${params.category ? `category=${params.category}&` : ''}${
                  params.organic ? 'organic=true' : ''
                }`}
                className="text-xs text-stone-500 hover:text-stone-800 underline"
              >
                Limpiar
              </Link>
            )}
          </form>
        </div>
      </div>

      {/* Grid de Productos */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 capitalize">
                    {product.category.replace('_', ' ')}
                  </span>
                  {product.discount_percentage > 0 && (
                    <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> -{product.discount_percentage}%
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-stone-900 text-lg leading-snug">
                    {product.name}
                  </h3>
                  {/* Productor y Pueblo */}
                  <p className="text-xs text-stone-500 mt-1">
                    {product.profiles?.full_name} · {product.profiles?.town}
                  </p>
                </div>

                {/* Etiquetas agronómicas */}
                <div className="flex flex-wrap gap-1.5 text-[11px] text-stone-600">
                  {product.is_organic && (
                    <span className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md text-emerald-700 font-medium">
                      <Leaf className="w-3 h-3" /> Ecológico
                    </span>
                  )}
                  {product.cultivation === 'invernadero' && (
                    <span className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md">
                      <Warehouse className="w-3 h-3 text-stone-500" /> Invernadero
                    </span>
                  )}
                  {product.cultivation === 'exterior' && (
                    <span className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md">
                      <Sun className="w-3 h-3 text-amber-500" /> Exterior
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="text-xs text-stone-600 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Precio y Botón de Pedido */}
              <div className="p-5 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-stone-900 text-xl">
                    {Number(product.price).toFixed(2)} €
                  </div>
                  {product.price_per_kilo && (
                    <div className="text-[10px] text-stone-500">
                      {Number(product.price_per_kilo).toFixed(2)} € / kg
                    </div>
                  )}
                </div>

                <Link
                  href={`/pedir/${product.id}`}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
                >
                  Comprar
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
          <p className="text-stone-500 text-sm">
            No se han encontrado productos con los filtros seleccionados.
          </p>
        </div>
      )}
    </div>
  );
}