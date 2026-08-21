import { createClient } from '@/lib/supabase/server';
import { ProductCategory, ProductWithSeller, Profile } from '@/types/database';
import { CatalogViewContainer } from '@/components/CatalogViewContainer';

interface SearchParams {
  category?: ProductCategory;
  town?: string;
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

  // 1. Obtener todos los productos activos con sus perfiles de vendedor
  const { data: productsData } = await supabase
    .from('products')
    .select('*, profiles!products_seller_id_fkey(id, full_name, town, avatar_url, phone, bio)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // 2. Obtener todos los vendedores registrados
  const { data: sellersData } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'vendedor')
    .order('full_name', { ascending: true });

  const products = (productsData || []) as unknown as ProductWithSeller[];
  const sellers = (sellersData || []) as unknown as Profile[];

  return (
    <div className="space-y-6 pb-8">
      <CatalogViewContainer
        products={products}
        sellers={sellers}
        userProfile={userProfile}
        selectedCategory={params.category}
        selectedTown={params.town}
      />
    </div>
  );
}