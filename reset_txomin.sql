-- ==============================================================================
-- RESETEAR Y DESBLOQUEAR USUARIO "Txomin Friki"
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu panel de Supabase:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Ver los datos actuales y el email exacto del usuario
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE id = 'f8b4700d-b875-490a-9827-c87ea3ca3d10'
   OR email ILIKE '%txomin%';

-- 2. LIMPIAR LA IMAGEN BASE64 DE user_metadata (Esto repara el bloqueo 494 de sesión)
UPDATE auth.users
SET raw_user_meta_data = (raw_user_meta_data - 'avatar_url')
WHERE id = 'f8b4700d-b875-490a-9827-c87ea3ca3d10';

-- 3. RESETEAR LA CONTRASEÑA A: 123456
-- (Puedes cambiar '123456' por la contraseña que tú quieras)
UPDATE auth.users
SET 
  encrypted_password = crypt('123456', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE id = 'f8b4700d-b875-490a-9827-c87ea3ca3d10';

-- 4. CONFIRMAR QUE EL PERFIL ESTÁ ACTIVO
UPDATE public.profiles
SET 
  role = 'comprador',
  seller_status = 'approved'
WHERE id = 'f8b4700d-b875-490a-9827-c87ea3ca3d10';

-- 5. Recargar schema
NOTIFY pgrst, 'reload schema';
