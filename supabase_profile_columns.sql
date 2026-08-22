-- ==============================================================================
-- ACTUALIZACIÓN DE COLUMNAS DE LA TABLA PROFILES
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu panel de Supabase:
-- 1. Ve a https://supabase.com/dashboard/project/_/sql
-- 2. Pega este código y pulsa "Run".
-- ==============================================================================

-- 1. Añadir columnas a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS birth_date TEXT,
ADD COLUMN IF NOT EXISTS dni TEXT,
ADD COLUMN IF NOT EXISTS address_notes TEXT,
ADD COLUMN IF NOT EXISTS saved_addresses JSONB DEFAULT '[]'::jsonb;

-- 2. Actualizar permisos para que supabase_auth_admin, anon y authenticated puedan leer y escribir
GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated, service_role, supabase_auth_admin;

-- 3. Recargar la caché del schema de PostgREST para aplicar los cambios al instante
NOTIFY pgrst, 'reload schema';
