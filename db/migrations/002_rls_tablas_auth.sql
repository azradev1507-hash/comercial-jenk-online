-- =====================================================================
-- 002 · RECOMENDADO: cerrar las tablas de usuarios y sesiones a la API pública
-- Sin RLS, la clave anon de Supabase podría LEER users_accounts.password_hash y
-- auth_sessions por PostgREST. Activar RLS SIN políticas las deja accesibles solo
-- para service_role (que ignora RLS), o sea, solo para el backend en Vercel.
-- Estas tablas son nuevas (esquema e-commerce v1.1): no las usa el sistema actual.
-- No toca ninguna tabla del sistema en producción.
-- =====================================================================
ALTER TABLE users_accounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_addresses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_one_time_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_login_attempts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_oauth_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_user_roles       ENABLE ROW LEVEL SECURITY;
