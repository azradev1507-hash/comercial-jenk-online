"""Única interfaz que otros módulos pueden importar de auth (autorización)."""
from ...shared.config import SESSION_COOKIE
from ...shared.http import HttpError, get_cookie
from . import service


def get_current_user(handler):
    """Usuario autenticado de la petición, o None."""
    return service.current_user(get_cookie(handler, SESSION_COOKIE))


def require_user(handler):
    """Usar al inicio de cualquier endpoint protegido: corta con 401 si no hay sesión válida."""
    user = get_current_user(handler)
    if not user:
        raise HttpError(401, "Inicia sesión para continuar.", "unauthorized")
    return user
