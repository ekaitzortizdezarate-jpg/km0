-- ==============================================================================
-- ACTUALIZACIÓN INTEGRAL DE BASE DE DATOS Y STORAGE (km0)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu panel de Supabase:
-- 1. Ve a https://supabase.com/dashboard/project/_/sql
-- 2. Pega este código y pulsa "Run".
-- ==============================================================================

-- 1. COLUMNAS DE LA TABLA PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS birth_date TEXT,
ADD COLUMN IF NOT EXISTS dni TEXT,
ADD COLUMN IF NOT EXISTS address_notes TEXT,
ADD COLUMN IF NOT EXISTS saved_addresses JSONB DEFAULT '[]'::jsonb;

-- 2. COLUMNAS DE LA TABLA ORDERS
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ;

-- 3. PERMISOS DE TABLAS
GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON TABLE public.orders TO postgres, anon, authenticated, service_role, supabase_auth_admin;

-- 4. BUCKET DE STORAGE PARA AVATARES E IMÁGENES (Público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage para avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Avatars públicos para lectura'
  ) THEN
    CREATE POLICY "Avatars públicos para lectura" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Usuarios autenticados pueden subir avatares'
  ) THEN
    CREATE POLICY "Usuarios autenticados pueden subir avatares" ON storage.objects
      FOR ALL TO authenticated USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
  END IF;
END $$;

-- 5. RECARGAR LA CACHÉ DEL SCHEMA DE POSTGREST
NOTIFY pgrst, 'reload schema';
