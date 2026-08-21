'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductCategory, ProductFormat, CultivationType } from '@/types/database';

export async function createProduct(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Debes iniciar sesión para publicar productos.' };
  }

  // Verificar que el vendedor esté aprobado
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, seller_status')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'vendedor' || profile?.seller_status !== 'approved') {
    return {
      error: 'Tu cuenta de productor aún no ha sido aprobada por el administrador.',
    };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as ProductCategory;
  const format = (formData.get('format') as ProductFormat) || 'suelto';
  const price = parseFloat(formData.get('price') as string);
  const price_per_kilo_raw = formData.get('price_per_kilo') as string;
  const weight_grams_raw = formData.get('weight_grams') as string;
  const best_before_date = (formData.get('best_before_date') as string) || null;
  const discount_percentage = parseInt(
    (formData.get('discount_percentage') as string) || '0',
    10
  );
  const is_organic = formData.get('is_organic') === 'on';
  const cultivation = (formData.get('cultivation') as CultivationType) || 'no_aplica';
  const stock = parseInt((formData.get('stock') as string) || '1', 10);

  const price_per_kilo = price_per_kilo_raw ? parseFloat(price_per_kilo_raw) : null;
  const weight_grams = weight_grams_raw ? parseInt(weight_grams_raw, 10) : null;

  const { error } = await supabase.from('products').insert({
    seller_id: user.id,
    name,
    description: description || null,
    category,
    format,
    price,
    price_per_kilo,
    weight_grams,
    best_before_date,
    discount_percentage,
    is_organic,
    cultivation,
    stock,
    is_active: true,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  redirect('/');
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('products').delete().eq('id', productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}