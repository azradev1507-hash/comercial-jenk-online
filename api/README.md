# Backend de autenticación (Vercel + Supabase)

Endpoints (`api/auth/[action].py`):
`POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`

## Puesta en marcha
1. En Supabase → SQL Editor, ejecutar en orden `db/migrations/001_auth_registro.sql` y `002_rls_tablas_auth.sql`
   (el esquema `schema_ecommerce_v1_1.sql` ya debe estar creado).
2. En Vercel → Settings → Environment Variables: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
   (la service role key solo vive en el servidor; nunca en `public/`).
3. Vercel usa `vercel.json` (`outputDirectory: public`). Probar local con `vercel dev`
   (con `vercel env pull` para traer las variables).

## Cómo funciona
- Contraseñas con scrypt (biblioteca estándar, sin dependencias). La BD guarda `scrypt$N$r$p$sal$hash`.
- Sesión: token aleatorio en cookie `jenk_session` (HttpOnly, SameSite=Lax, Secure en https, 30 días).
  En `auth_sessions.refresh_token_hash` solo se guarda su SHA-256.
- Registro atómico: la función SQL `auth_register_user` crea cuenta, perfil, dirección (con coordenadas)
  y rol `customer` en una transacción; los duplicados vuelven como `email-existe` o `cedula-existe`.
- Fuerza bruta: 5 fallos por correo o 30 por IP en 15 minutos → 429 (usa `auth_login_attempts`).
- CSRF: cookie SameSite=Lax, solo JSON y comprobación de `Origin`.
- Errores: `{ "error": { "code", "message", "fields?" } }`.

## Pendiente
- Verificación de correo: la cuenta queda `active` al registrarse. Para exigirla hace falta un proveedor de
  correo; entonces `p_status` pasa a `'pending'`, se crea el token en `auth_one_time_tokens` y se responde `verificacion: true`.
- Recuperar contraseña (`password_reset` en `auth_one_time_tokens`) y roles/permisos del panel.
