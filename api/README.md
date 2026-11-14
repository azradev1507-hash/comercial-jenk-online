# Backend de autenticación (Vercel + Supabase)

Endpoints (`api/auth/register.py`, `login.py`, `logout.py` y `me.py` (la lógica común está en `api/_lib/`)):
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
- Sin mock ni caché en el navegador: no existe modo simulado; el frontend no escribe en `localStorage`,
  `sessionStorage`, IndexedDB ni Cache API, y no hay service worker (`js/utils/sin-cache.js` retira el que
  dejaron versiones anteriores; se puede borrar pasadas unas semanas). `/api/*` responde `Cache-Control: no-store`.

## Pruebas (proyecto Supabase de PRUEBAS, nunca producción)
```
export JENK_TEST_CONFIRM=si BASE_URL=http://localhost:3000 DATABASE_URL=postgresql://...   # vercel dev en otra terminal
python3 tests/e2e_registro.py                          # API + BD: registro, duplicados, atomicidad, validación, CSRF, concurrencia, login/logout, fuerza bruta
cd tests && npm install && npm run frontend             # JS real del formulario + espías de localStorage/caché
```
Crean y borran cuentas `@example.com`. Verificadas con Postgres 16 + PostgREST y este esquema: 74 + 22 comprobaciones.

## Pendiente
- Sin límite de frecuencia en `POST /register` (el de fuerza bruta cubre solo el login): conviene limitar altas por IP.
- Si falla la creación de la sesión justo después de crear la cuenta, el usuario ve error pero la cuenta existe (al reintentar: `email-existe`).
- `auth_user_roles.user_id` y `auth_sessions.user_id` no tienen FK a `users_accounts` (convención entre módulos del esquema): al borrar una cuenta hay que borrar esas filas a mano; en producción usar `status = 'deleted'`.
- `POST /api/auth/recover` no existe aún: la pantalla «Recuperar» muestra error (no finge éxito).
- Siguen con datos de ejemplo/navegador, fuera del alcance del registro: catálogo, promos, cupones y entrega (`api.js`) y carrito (`localStorage`, `services/carrito.js`).
- Verificación de correo: la cuenta queda `active` al registrarse. Para exigirla hace falta un proveedor de
  correo; entonces `p_status` pasa a `'pending'`, se crea el token en `auth_one_time_tokens` y se responde `verificacion: true`.
- Recuperar contraseña (`password_reset` en `auth_one_time_tokens`) y roles/permisos del panel.
