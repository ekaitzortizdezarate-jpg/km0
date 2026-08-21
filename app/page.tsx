import { createClient } from '@/lib/supabase/server';
import { ProductCategory, ProductWithSeller, Profile } from '@/types/database';
import {
  Leaf,
  Sun,
  Warehouse,
  Tag,
  Search,
  PlusCircle,
  Edit,
  Clock,
  MessageCircle,
  Package,
  Scale,
  Layers,
  Store,
} from 'lucide-react';
import Link from 'next/link';
import { getDeliveryEstimate, formatTimeAgo } from '@/lib/delivery';
import { DeleteProductButton } from '@/components/DeleteProductButton';
import { FavoriteButton } from '@/components/FavoriteButton';

interface SearchParams {
  category?: ProductCategory;
  organic?: string;
  town?: string;
  tab?: 'mis_productos' | 'todos';
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Usuario autenticado y perfil
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userProfile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    userProfile = data;
  }

  const isSeller = userProfile?.role === 'vendedor';

  // Determinamos qué pestaña está activa para el vendedor
  // Por defecto, un vendedor ve "mis_productos" salvo que seleccione "todos"
  const activeTab = isSeller
    ? params.tab === 'todos'
      ? 'todos'
      : 'mis_productos'
    : 'todos';

  // Consulta dinámica con filtros
  let query = supabase
    .from('products')
    .select('*, profiles!products_seller_id_fkey(id, full_name, town, avatar_url, phone)')
    .eq('is_active', true);

  if (isSeller && activeTab === 'mis_productos') {
    query = query.eq('seller_id', user!.id);
  }

  if (params.category) {
    query = query.eq('category', params.category);
  }
  if (params.organic === 'true') {
    query = query.eq('is_organic', true);
  }
  if (params.town) {
    query = query.ilike('profiles.town', `%${params.town}%`);
  }

  const { data: rawProducts } = await query.order('created_at', {
    ascending: false,
  });
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
      {/* Banner de Bienvenida */}
      <div className="bg-emerald-900 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="bg-emerald-800 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            km0 · Caserío y Proximidad
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Alimentos frescos de caserío cerca de ti.
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base font-medium">
            Conecta directamente con productores locales sin intermediarios.
          </p>
        </div>
      </div>

      {/* PESTAÑAS PARA EL VENDEDOR: Mis Productos vs Catálogo General */}
      {isSeller && (
        <div className="bg-white p-2 rounded-2xl border-2 border-stone-200 shadow-sm flex flex-wrap gap-2">
          <Link
            href="/?tab=mis_productos"
            className={`flex-1 min-w-[140px] text-center py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'mis_productos'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Mis Productos ({activeTab === 'mis_productos' ? products?.length || 0 : 'Panel'})</span>
          </Link>

          <Link
            href="/?tab=todos"
            className={`flex-1 min-w-[140px] text-center py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'todos'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
            }`}
          >
            <span>Ver Otros Vendedores / Catálogo General</span>
          </Link>

          <Link
            href="/vendedor/productos/nuevo"
            className="py-2.5 px-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-300"
          >
            <PlusCircle className="w-4 h-4 text-emerald-800" />
            <span>Publicar Nuevo</span>
          </Link>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-stone-200 shadow-sm space-y-4">
        {/* Categorías */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/?${isSeller ? `tab=${activeTab}&` : ''}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              !params.category
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                : 'border-stone-300 text-stone-800 hover:bg-stone-100'
            }`}
          >
            Todos
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.value}
              href={`/?${isSeller ? `tab=${activeTab}&` : ''}category=${cat.value}${
                params.organic ? '&organic=true' : ''
              }${params.town ? `&town=${encodeURIComponent(params.town)}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                params.category === cat.value
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                  : 'border-stone-300 text-stone-800 hover:bg-stone-100'
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        {/* Filtro Ecológico y Buscador por municipio */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-stone-200 text-sm text-stone-800">
          <Link
            href={`/?${isSeller ? `tab=${activeTab}&` : ''}${
              params.category ? `category=${params.category}&` : ''
            }${params.organic === 'true' ? '' : 'organic=true'}${
              params.town ? `&town=${encodeURIComponent(params.town)}` : ''
            }`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${
              params.organic === 'true'
                ? 'bg-emerald-100 border-emerald-400 text-emerald-950 shadow-sm'
                : 'border-stone-300 hover:bg-stone-100 text-stone-800'
            }`}
          >
            <Leaf className="w-4 h-4 text-emerald-700" />
            Solo Ecológico
          </Link>

          <form method="GET" action="/" className="flex items-center gap-2">
            {isSeller && <input type="hidden" name="tab" value={activeTab} />}
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.organic && <input type="hidden" name="organic" value={params.organic} />}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                name="town"
                defaultValue={params.town || ''}
                placeholder="Buscar por municipio..."
                className="pl-8 pr-3 py-1.5 text-xs font-bold border-2 border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-stone-900 placeholder:text-stone-500"
              />
            </div>
            <button
              type="submit"
              className="text-xs font-bold bg-stone-900 hover:bg-black text-white px-3 py-1.5 rounded-xl transition-colors shadow-sm"
            >
              Buscar
            </button>
            {params.town && (
              <Link
                href={`/?${isSeller ? `tab=${activeTab}&` : ''}${
                  params.category ? `category=${params.category}&` : ''
                }${params.organic ? 'organic=true' : ''}`}
                className="text-xs font-bold text-stone-600 hover:text-stone-900 underline"
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
          {products.map((product) => {
            const isOwnProduct = user?.id === product.seller_id;
            const deliveryInfo = getDeliveryEstimate(
              product.availability_type,
              product.availability_days,
              product.availability_weekdays,
              product.available_from_date
            );

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl border-2 border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Foto del Producto o Placeholder */}
                  <div className="relative w-full h-48 bg-stone-100 overflow-hidden group">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 bg-stone-100">
                        <Package className="w-12 h-12 text-stone-400 mb-1" />
                        <span className="text-[11px] font-bold text-stone-500">Caserío km0</span>
                      </div>
                    )}

                    {/* Botón Favorito en la esquina superior */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <FavoriteButton id={product.id} type="product" />
                    </div>

                    {/* Badge Formato de Producto */}
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-black/80 text-white backdrop-blur-md flex items-center gap-1">
                        {product.format === 'granel' && <Scale className="w-3 h-3 text-emerald-400" />}
                        {product.format === 'suelto' && <Layers className="w-3 h-3 text-amber-400" />}
                        {product.format === 'pack' && <Package className="w-3 h-3 text-cyan-400" />}
                        <span className="capitalize">
                          {product.format === 'granel'
                            ? 'A Granel'
                            : product.format === 'suelto'
                            ? product.weight_kg
                              ? 'Pieza pesada'
                              : 'Por Unidad'
                            : 'Pack / Cesta'}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Categoría y Descuento */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-emerald-950 bg-emerald-100 px-2.5 py-0.5 rounded-md capitalize">
                        {product.category.replace('_', ' ')}
                      </span>

                      {product.discount_percentage > 0 && (
                        <span className="text-[11px] font-black text-red-800 bg-red-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Tag className="w-3 h-3" /> -{product.discount_percentage}%
                        </span>
                      )}
                    </div>

                    {/* Título */}
                    <div>
                      <h3 className="font-black text-stone-900 text-lg leading-snug">
                        {product.name}
                      </h3>

                      {/* Fecha de Publicación */}
                      <p className="text-[11px] font-semibold text-stone-600 flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5 text-stone-500" />
                        <span>Publicado {formatTimeAgo(product.created_at)}</span>
                      </p>
                    </div>

                    {/* Vendedor / Caserío */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {product.profiles?.avatar_url ? (
                          <img
                            src={product.profiles.avatar_url}
                            alt={product.profiles.full_name}
                            className="w-7 h-7 rounded-full object-cover border border-stone-300"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-300">
                            {product.profiles?.full_name?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-stone-900 leading-none">
                            {product.profiles?.full_name}
                          </p>
                          <p className="text-[10px] font-semibold text-stone-600 mt-0.5">
                            {product.profiles?.town}
                          </p>
                        </div>
                      </div>

                      {/* Botón Favorito Vendedor */}
                      {product.profiles?.id && (
                        <FavoriteButton id={product.profiles.id} type="seller" />
                      )}
                    </div>

                    {/* Condiciones de Entrega Estimada */}
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-[11px] font-bold text-stone-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">{deliveryInfo.detailText}</span>
                    </div>

                    {/* Contenido del Pack (si es pack) */}
                    {product.format === 'pack' && product.pack_items && (
                      <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200/80 text-[11px] text-stone-800 space-y-0.5">
                        <span className="font-black text-amber-950 block">Incluye:</span>
                        <p className="line-clamp-2 font-medium">{product.pack_items}</p>
                      </div>
                    )}

                    {/* Etiquetas Agronómicas */}
                    <div className="flex flex-wrap gap-1.5 text-[11px] font-bold text-stone-800">
                      {product.is_organic && (
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-950 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <Leaf className="w-3 h-3 text-emerald-700" /> Ecológico
                        </span>
                      )}
                      {product.cultivation === 'invernadero' && (
                        <span className="flex items-center gap-1 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md">
                          <Warehouse className="w-3 h-3 text-stone-600" /> Invernadero
                        </span>
                      )}
                      {product.cultivation === 'exterior' && (
                        <span className="flex items-center gap-1 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md">
                          <Sun className="w-3 h-3 text-amber-600" /> Exterior
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Tarjeta: Precios y Acciones */}
                <div className="p-4 sm:p-5 bg-stone-50 border-t-2 border-stone-200 flex items-center justify-between gap-3">
                  <div>
                    {product.format === 'granel' ? (
                      <div>
                        <div className="font-black text-stone-900 text-xl">
                          {Number(product.price_per_kilo || product.price).toFixed(2)} €
                        </div>
                        <div className="text-[10px] font-extrabold text-stone-600">por Kilo</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-black text-stone-900 text-xl">
                          {Number(product.price).toFixed(2)} €
                        </div>
                        {product.format === 'pack' && (
                          <div className="text-[10px] font-extrabold text-stone-600">
                            por pack
                          </div>
                        )}
                        {product.format === 'suelto' && !product.weight_kg && (
                          <div className="text-[10px] font-extrabold text-stone-600">
                            por unidad
                          </div>
                        )}
                        {product.price_per_kilo && (
                          <div className="text-[10px] font-extrabold text-stone-600">
                            {Number(product.price_per_kilo).toFixed(2)} € / kg
                          </div>
                        )}
                        {product.format === 'suelto' && product.weight_kg && (
                          <div className="text-[10px] font-extrabold text-stone-600">
                            {product.weight_kg} kg / pieza
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Acciones según el rol y dueño del producto */}
                  {isOwnProduct ? (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/vendedor/productos/${product.id}/editar`}
                        className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl transition-colors border border-amber-300 font-bold text-xs flex items-center gap-1 shadow-sm"
                        title="Editar producto"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </Link>
                      <DeleteProductButton productId={product.id} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {product.profiles?.id && (
                        <Link
                          href={`/chat/${product.profiles.id}`}
                          title="Enviar mensaje al caserío"
                          className="p-2 bg-stone-200 hover:bg-stone-300 text-stone-900 rounded-xl transition-colors border border-stone-300"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Link>
                      )}
                      <Link
                        href={`/pedir/${product.id}`}
                        className="bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-colors shadow-sm"
                      >
                        Comprar
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-stone-200 p-8 space-y-3">
          <p className="text-stone-800 font-bold text-base">
            {isSeller && activeTab === 'mis_productos'
              ? 'Aún no has publicado ningún producto en tu caserío.'
              : 'No se han encontrado productos con los filtros seleccionados.'}
          </p>
          {isSeller && activeTab === 'mis_productos' && (
            <Link
              href="/vendedor/productos/nuevo"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <PlusCircle className="w-5 h-5" /> Publicar mi primer producto
            </Link>
          )}
        </div>
      )}
    </div>
  );
}