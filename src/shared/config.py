"""Configuración desde variables de entorno (en Vercel: Project Settings > Environment Variables).
Nunca se escriben claves en el código ni se envían al navegador."""
import os


def env(name, default=None, required=False):
    value = os.environ.get(name, default)
    if required and not value:
        raise RuntimeError(f"Falta la variable de entorno {name}")
    return value


def supabase_url():
    return env("SUPABASE_URL", required=True).rstrip("/")


def supabase_secret_key():
    # Acepta el nombre nuevo (secret key) o el clásico (service_role).
    key = env("SUPABASE_SECRET_KEY") or env("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        raise RuntimeError("Falta SUPABASE_SECRET_KEY (clave secreta de Supabase)")
    return key


SESSION_DAYS = 30
SESSION_COOKIE = "session"
