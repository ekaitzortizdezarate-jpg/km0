'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  ProductCategory,
  ProductFormat,
  CultivationType,
  AvailabilityType,
} from '@/types/database';

export async function createProduct(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Debes iniciar sesión para publicar productos.' };
  }

  // Verificar rol de vendedor
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, seller_status')
    .eq('id', user.id)
    .single();

  if (profile && profile.role !== 'vendedor' && profile.role !== 'admin') {
    return {
      error: 'Solo los usuarios registrados como vendedor pueden publicar productos.',
    };
  }

  if (profile?.seller_status === 'rejected') {
    return {
      error: 'Tu cuenta de productor ha sido rechazada por el administrador.',
    };
  }

  // Asegurar que el seller_status quede como approved si aún era pending o null
  if (profile?.seller_status !== 'approved') {
    await supabase
      .from('profiles')
      .update({ seller_status: 'approved' })
      .eq('id', user.id);
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as ProductCategory;
  const format = (formData.get('format') as ProductFormat) || 'suelto';
  const price_raw = formData.get('price') as string;
  const price_per_kilo_raw = formData.get('price_per_kilo') as string;
  const weight_kg_raw = formData.get('weight_kg') as string;
  const pack_items = (formData.get('pack_items') as string) || null;
  const best_before_date = (formData.get('best_before_date') as string) || null;
  const discount_percentage = parseInt(
    (formData.get('discount_percentage') as string) || '0',
    10
  );
  const is_organic = formData.get('is_organic') === 'on';
  const cultivation = (formData.get('cultivation') as CultivationType) || 'no_aplica';
  const is_unlimited_stock = formData.get('is_unlimited_stock') === 'on';
  const stock = is_unlimited_stock ? 99999 : parseInt((formData.get('stock') as string) || '1', 10);
  const image_url = (formData.get('image_url') as string) || null;

  // Condiciones de entrega
  const availability_type = (formData.get('availability_type') as AvailabilityType) || 'inmediato';
  const availability_days = formData.get('availability_days')
    ? parseInt(formData.get('availability_days') as string, 10)
    : null;
  const weekdays_raw = formData.getAll('availability_weekdays') as string[];
  const availability_weekdays = weekdays_raw.length > 0 ? weekdays_raw : null;
  const available_from_date = (formData.get('available_from_date') as string) || null;

  let price = price_raw ? parseFloat(price_raw) : 0;
  let price_per_kilo = price_per_kilo_raw ? parseFloat(price_per_kilo_raw) : null;
  const weight_kg = weight_kg_raw ? parseFloat(weight_kg_raw) : null;

  if (format === 'granel') {
    if (price_per_kilo && !price) {
      price = price_per_kilo;
    }
  } else if (format === 'suelto') {
    if (price && weight_kg && weight_kg > 0 && !price_per_kilo) {
      price_per_kilo = Number((price / weight_kg).toFixed(2));
    } else if (price_per_kilo && weight_kg && weight_kg > 0 && !price) {
      price = Number((price_per_kilo * weight_kg).toFixed(2));
    }
  }

  // Intento 1: Guardar con todas las columnas completas
  const fullPayload = {
    seller_id: user.id,
    name,
    description: description || null,
    category,
    format,
    price,
    price_per_kilo,
    weight_kg,
    pack_items,
    best_before_date,
    discount_percentage,
    is_organic,
    cultivation,
    stock,
    is_unlimited_stock,
    image_url,
    availability_type,
    availability_days,
    availability_weekdays,
    available_from_date,
    is_active: true,
  };

  const { error: fullError } = await supabase.from('products').insert(fullPayload);

  if (fullError) {
    // Si falta alguna columna en Supabase (ej. availability_days), guardamos en las columnas base
    if (fullError.message?.includes('column') || fullError.code === 'PGRST204') {
      const fallbackPayload: Record<string, unknown> = {
        seller_id: user.id,
        name,
        description: description || null,
        category,
        format: format === 'pack' ? 'pack_cesta' : 'suelto',
        price,
        price_per_kilo,
        weight_grams: weight_kg ? Math.round(weight_kg * 1000) : null,
        best_before_date,
        discount_percentage,
        is_organic,
        cultivation,
        stock,
        image_url,
        is_active: true,
      };

      const { error: fallbackError } = await supabase
        .from('products')
        .insert(fallbackPayload);

      if (fallbackError) {
        return {
          error: `Error de base de datos: ${fallbackError.message}. Ejecuta el script supabase_migration.sql en tu panel de Supabase.`,
        };
      }
    } else {
      return { error: fullError.message };
    }
  }

  revalidatePath('/');
  redirect('/');
}

export async function updateProduct(productId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Debes iniciar sesión para editar productos.' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as ProductCategory;
  const format = (formData.get('format') as ProductFormat) || 'suelto';
  const price_raw = formData.get('price') as string;
  const price_per_kilo_raw = formData.get('price_per_kilo') as string;
  const weight_kg_raw = formData.get('weight_kg') as string;
  const pack_items = (formData.get('pack_items') as string) || null;
  const best_before_date = (formData.get('best_before_date') as string) || null;
  const discount_percentage = parseInt(
    (formData.get('discount_percentage') as string) || '0',
    10
  );
  const is_organic = formData.get('is_organic') === 'on';
  const cultivation = (formData.get('cultivation') as CultivationType) || 'no_aplica';
  const is_unlimited_stock = formData.get('is_unlimited_stock') === 'on';
  const stock = is_unlimited_stock ? 99999 : parseInt((formData.get('stock') as string) || '1', 10);
  const image_url = (formData.get('image_url') as string) || null;

  // Condiciones de entrega
  const availability_type = (formData.get('availability_type') as AvailabilityType) || 'inmediato';
  const availability_days = formData.get('availability_days')
    ? parseInt(formData.get('availability_days') as string, 10)
    : null;
  const weekdays_raw = formData.getAll('availability_weekdays') as string[];
  const availability_weekdays = weekdays_raw.length > 0 ? weekdays_raw : null;
  const available_from_date = (formData.get('available_from_date') as string) || null;

  let price = price_raw ? parseFloat(price_raw) : 0;
  let price_per_kilo = price_per_kilo_raw ? parseFloat(price_per_kilo_raw) : null;
  const weight_kg = weight_kg_raw ? parseFloat(weight_kg_raw) : null;

  if (format === 'granel') {
    if (price_per_kilo && !price) {
      price = price_per_kilo;
    }
  } else if (format === 'suelto') {
    if (price && weight_kg && weight_kg > 0 && !price_per_kilo) {
      price_per_kilo = Number((price / weight_kg).toFixed(2));
    } else if (price_per_kilo && weight_kg && weight_kg > 0 && !price) {
      price = Number((price_per_kilo * weight_kg).toFixed(2));
    }
  }

  const fullUpdate = {
    name,
    description: description || null,
    category,
    format,
    price,
    price_per_kilo,
    weight_kg,
    pack_items,
    best_before_date,
    discount_percentage,
    is_organic,
    cultivation,
    stock,
    is_unlimited_stock,
    image_url,
    availability_type,
    availability_days,
    availability_weekdays,
    available_from_date,
    updated_at: new Date().toISOString(),
  };

  const { error: fullError } = await supabase
    .from('products')
    .update(fullUpdate)
    .eq('id', productId)
    .eq('seller_id', user.id);

  if (fullError) {
    if (fullError.message?.includes('column') || fullError.code === 'PGRST204') {
      const fallbackUpdate = {
        name,
        description: description || null,
        category,
        format: format === 'pack' ? 'pack_cesta' : 'suelto',
        price,
        price_per_kilo,
        weight_grams: weight_kg ? Math.round(weight_kg * 1000) : null,
        best_before_date,
        discount_percentage,
        is_organic,
        cultivation,
        stock,
        image_url,
        updated_at: new Date().toISOString(),
      };

      const { error: fallbackError } = await supabase
        .from('products')
        .update(fallbackUpdate)
        .eq('id', productId)
        .eq('seller_id', user.id);

      if (fallbackError) {
        return { error: fallbackError.message };
      }
    } else {
      return { error: fullError.message };
    }
  }

  revalidatePath('/');
  redirect('/');
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado.' };
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('seller_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}