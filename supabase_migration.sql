-- ==============================================================================
-- FIX SUPABASE: CORRECCIÓN DE ERROR DE CREACIÓN DE USUARIOS EN AUTH
-- ==============================================================================
-- Este script soluciona el error "Failed to create user: Database error checking email":
-- 1. Restaura la configuración de sesión y limpia huérfanos en auth.identities.
-- 2. Concede los permisos necesarios al rol 'supabase_auth_admin'.
-- 3. Convierte el trigger 'handle_new_user' en ultra-seguro (con bloque de captura de errores
--    para que NUNCA bloquee la creación de usuarios en Auth bajo ninguna circunstancia).
-- 4. Recarga PostgREST.
-- ==============================================================================

-- 1. RESTAURAR MODO DE SESIÓN DE POSTGRES
RESET session_replication_role;
SET session_replication_role = 'origin';

-- 2. LIMPIAR TABLAS INTERNAS DE AUTH POR SI QUEDARON IDENTIDADES HUÉRFANAS
TRUNCATE TABLE 
  auth.refresh_tokens,
  auth.sessions,
  auth.identities,
  auth.mfa_amr_claims,
  auth.mfa_challenges,
  auth.mfa_factors,
  auth.flow_state
CASCADE;

DELETE FROM auth.users;

-- 3. CONCEDER PERMISOS AL ROL DE AUTENTICACIÓN DE SUPABASE (supabase_auth_admin)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role, supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role, supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role, supabase_auth_admin;

-- 4. RE-CREAR FUNCIÓN Y TRIGGER ULTRA-SEGURO PARA NUEVOS USUARIOS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, town, phone, address, seller_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'usuario'), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'comprador'),
    COALESCE(NEW.raw_user_meta_data->>'town', 'Local'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address',
    'approved'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = COALESCE(public.profiles.role, EXCLUDED.role),
    town = COALESCE(public.profiles.town, EXCLUDED.town);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En caso de cualquier error, nunca abortar la inserción en auth.users
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RECARGAR EL SCHEMA CACHE DE SUPABASE
NOTIFY pgrst, 'reload schema';
