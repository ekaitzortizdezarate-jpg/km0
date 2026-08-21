-- ==============================================================================
-- KM0 - SQL MIGRATION SCRIPT
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase
-- ==============================================================================

-- 1. Actualizar tabla 'products' con nuevas columnas
ALTER TABLE IF EXISTS products 
  ADD COLUMN IF NOT EXISTS format text DEFAULT 'suelto',
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS pack_items text,
  ADD COLUMN IF NOT EXISTS is_unlimited_stock boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS availability_type text DEFAULT 'inmediato',
  ADD COLUMN IF NOT EXISTS availability_days integer,
  ADD COLUMN IF NOT EXISTS availability_weekdays text[],
  ADD COLUMN IF NOT EXISTS available_from_date date;

-- 2. Actualizar tabla 'orders' para guardar fecha estimada de entrega
ALTER TABLE IF EXISTS orders 
  ADD COLUMN IF NOT EXISTS estimated_delivery_date timestamptz;

-- 3. Actualizar tabla 'profiles' para soportar avatar / foto del vendedor
ALTER TABLE IF EXISTS profiles 
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 4. Recargar el schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
