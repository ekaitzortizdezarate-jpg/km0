-- ==============================================================================
-- KM0 - SCRIPT DE MIGRACIÓN Y CONFIGURACIÓN COMPLETA DE SUPABASE
-- Copia y ejecuta este script completo en el SQL Editor de tu proyecto Supabase:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==============================================================================

-- 1. ACTUALIZAR O CREAR TABLA 'profiles'
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'comprador',
  full_name TEXT,
  phone TEXT,
  address TEXT,
  town TEXT,
  avatar_url TEXT,
  bio TEXT,
  seller_status TEXT DEFAULT 'approved',
  saved_addresses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'comprador',
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS town TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS seller_status TEXT DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS saved_addresses JSONB DEFAULT '[]'::jsonb;

-- Asegurar que todos los vendedores existentes estén aprobados
UPDATE public.profiles SET seller_status = 'approved' WHERE role = 'vendedor' AND (seller_status IS NULL OR seller_status = 'pending');

-- 2. ACTUALIZAR O CREAR TABLA 'products'
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_format') THEN
    BEGIN
      ALTER TYPE product_format ADD VALUE IF NOT EXISTS 'granel';
      ALTER TYPE product_format ADD VALUE IF NOT EXISTS 'pack';
      ALTER TYPE product_format ADD VALUE IF NOT EXISTS 'pack_cesta';
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  format TEXT DEFAULT 'suelto',
  price NUMERIC NOT NULL DEFAULT 0,
  price_per_kilo NUMERIC,
  weight_kg NUMERIC,
  pack_items TEXT,
  best_before_date DATE,
  discount_percentage INTEGER DEFAULT 0,
  is_organic BOOLEAN DEFAULT FALSE,
  cultivation TEXT DEFAULT 'no_aplica',
  stock NUMERIC DEFAULT 10,
  is_unlimited_stock BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  availability_type TEXT DEFAULT 'inmediato',
  availability_days INTEGER DEFAULT 1,
  availability_weekdays TEXT[],
  available_from_date DATE,
  delivery_methods TEXT[] DEFAULT ARRAY['caserio', 'punto_entrega', 'domicilio']::TEXT[],
  caserio_schedule TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar tipos de columna flexibles
ALTER TABLE public.products ALTER COLUMN format TYPE TEXT;
ALTER TABLE public.products ALTER COLUMN stock TYPE NUMERIC;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'suelto',
  ADD COLUMN IF NOT EXISTS price_per_kilo NUMERIC,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS pack_items TEXT,
  ADD COLUMN IF NOT EXISTS best_before_date DATE,
  ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_organic BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cultivation TEXT DEFAULT 'no_aplica',
  ADD COLUMN IF NOT EXISTS stock NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS is_unlimited_stock BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS availability_type TEXT DEFAULT 'inmediato',
  ADD COLUMN IF NOT EXISTS availability_days INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS availability_weekdays TEXT[],
  ADD COLUMN IF NOT EXISTS available_from_date DATE,
  ADD COLUMN IF NOT EXISTS delivery_methods TEXT[] DEFAULT ARRAY['caserio', 'punto_entrega', 'domicilio']::TEXT[],
  ADD COLUMN IF NOT EXISTS caserio_schedule TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. ACTUALIZAR O CREAR TABLA 'delivery_points'
CREATE TABLE IF NOT EXISTS public.delivery_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'sitio_fisico',
  town TEXT NOT NULL,
  address_details TEXT NOT NULL,
  schedule_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.delivery_points ALTER COLUMN type TYPE TEXT;
ALTER TABLE public.delivery_points 
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'sitio_fisico',
  ADD COLUMN IF NOT EXISTS schedule_notes TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 4. ACTUALIZAR O CREAR TABLA 'orders'
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  delivery_point_id UUID REFERENCES public.delivery_points(id) ON DELETE SET NULL,
  shipping_address TEXT,
  status TEXT DEFAULT 'pendiente',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_interval_days INTEGER,
  estimated_delivery_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_point_id UUID REFERENCES public.delivery_points(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shipping_address TEXT,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recurrence_interval_days INTEGER;

-- 5. ACTUALIZAR O CREAR TABLA 'order_items'
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.order_items ALTER COLUMN quantity TYPE NUMERIC;

-- 6. ACTUALIZAR O CREAR TABLA 'chat_messages'
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ACTUALIZAR O CREAR TABLA 'reviews'
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- FUNCIONES SEGURAS DE GESTIÓN DE STOCK (SECURITY DEFINER)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_product_id UUID, p_quantity NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - p_quantity)
  WHERE id = p_product_id AND is_unlimited_stock = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.restore_product_stock(p_product_id UUID, p_quantity NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock = stock + p_quantity
  WHERE id = p_product_id AND is_unlimited_stock = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos de ejecución para usuarios autenticados
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(UUID, NUMERIC) TO anon;
GRANT EXECUTE ON FUNCTION public.restore_product_stock(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_product_stock(UUID, NUMERIC) TO anon;

-- ==============================================================================
-- CONFIGURACIÓN DE POLÍTICAS DE SEGURIDAD (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;

DROP POLICY IF EXISTS "delivery_points_select_policy" ON public.delivery_points;
DROP POLICY IF EXISTS "delivery_points_insert_policy" ON public.delivery_points;
DROP POLICY IF EXISTS "delivery_points_update_policy" ON public.delivery_points;
DROP POLICY IF EXISTS "delivery_points_delete_policy" ON public.delivery_points;

DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON public.orders;

DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_policy" ON public.order_items;

DROP POLICY IF EXISTS "chat_messages_select_policy" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_policy" ON public.chat_messages;

DROP POLICY IF EXISTS "reviews_select_policy" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON public.reviews;

-- Políticas 'profiles'
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas 'products'
CREATE POLICY "products_select_policy" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_insert_policy" ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "products_update_policy" ON public.products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "products_delete_policy" ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- Políticas 'delivery_points'
CREATE POLICY "delivery_points_select_policy" ON public.delivery_points FOR SELECT USING (true);
CREATE POLICY "delivery_points_insert_policy" ON public.delivery_points FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "delivery_points_update_policy" ON public.delivery_points FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "delivery_points_delete_policy" ON public.delivery_points FOR DELETE USING (auth.uid() = seller_id);

-- Políticas 'orders'
CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "orders_insert_policy" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "orders_update_policy" ON public.orders FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "orders_delete_policy" ON public.orders FOR DELETE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Políticas 'order_items'
CREATE POLICY "order_items_select_policy" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "order_items_insert_policy" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_delete_policy" ON public.order_items FOR DELETE USING (true);

-- Políticas 'chat_messages' (permitir marcar como leídos a los receptores)
CREATE POLICY "chat_messages_select_policy" ON public.chat_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "chat_messages_insert_policy" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "chat_messages_update_policy" ON public.chat_messages FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- Políticas 'reviews'
CREATE POLICY "reviews_select_policy" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_policy" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- 8. RECARGAR EL SCHEMA CACHE DE POSTGREST
NOTIFY pgrst, 'reload schema';
