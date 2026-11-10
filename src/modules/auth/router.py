"""Rutas HTTP del módulo auth: /api/auth/{login,register,logout,me}."""
import sys
import traceback
from urllib.parse import parse_qs, urlparse

from ...shared.config import SESSION_COOKIE, SESSION_DAYS
from ...shared.db import DbError
from ...shared.http import HttpError, build_cookie, get_cookie, read_json, send_json
from . import public, service


def _action(handler):
    parsed = urlparse(handler.path)
    query = parse_qs(parsed.query)
    # vercel.json reescribe /api/auth/:action a /api/auth?action=:action
    return (query.get("action") or [parsed.path.rstrip("/").split("/")[-1]])[0]


def _login(handler):
    token, user = service.login(read_json(handler))
    cookie = build_cookie(handler, SESSION_COOKIE, token, SESSION_DAYS * 86400)
    send_json(handler, 200, user, cookies=[cookie])


def _register(handler):
    send_json(handler, 201, service.register(read_json(handler)))


def _logout(handler):
    service.logout(get_cookie(handler, SESSION_COOKIE))
    send_json(handler, 204, cookies=[build_cookie(handler, SESSION_COOKIE, "", 0)])


def _me(handler):
    user = public.require_user(handler)
    send_json(handler, 200, user)


ROUTES = {
    ("POST", "login"): _login,
    ("POST", "register"): _register,
    ("POST", "logout"): _logout,
    ("GET", "me"): _me,
}


def dispatch(handler):
    method = handler.command
    try:
        route = ROUTES.get((method, _action(handler)))
        if not route:
            raise HttpError(404, "Ruta no encontrada.", "not_found")
        route(handler)
    except HttpError as err:
        send_json(handler, err.status, {"message": err.message, "code": err.code, "details": err.details})
    except (DbError, RuntimeError) as err:
        # Detalle solo en los logs de Vercel; el navegador recibe un mensaje genérico.
        print(f"[auth] {err}", file=sys.stderr)
        send_json(handler, 500, {"message": "Error del servidor. Inténtalo de nuevo en un momento.", "code": "server_error"})
    except Exception:
        traceback.print_exc()
        send_json(handler, 500, {"message": "Error del servidor. Inténtalo de nuevo en un momento.", "code": "server_error"})
