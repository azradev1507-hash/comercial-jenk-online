"""Utilidades HTTP compartidas por las funciones de la API.

El prefijo "_" hace que Vercel NO exponga este archivo como endpoint.
Cada endpoint (register.py, login.py, sesion.py) es un archivo suelto con su `class handler`;
no hay __init__.py ni subcarpetas dentro de api/.
"""
import json
import os
import sys
from http.cookies import SimpleCookie
from urllib.parse import urlparse

COOKIE = 'jenk_session'
MAX_CUERPO = 20_000


class ErrorPeticion(Exception):
    """Error esperado: se devuelve tal cual al navegador con su código HTTP."""

    def __init__(self, status, code, mensaje, campos=None):
        super().__init__(mensaje)
        self.status, self.code, self.mensaje, self.campos = status, code, mensaje, campos


# ---------------------------------------------------------------- respuestas
def responder(h, status, cuerpo=None, cookies=(), extra=None):
    payload = json.dumps(cuerpo if cuerpo is not None else {}, ensure_ascii=False).encode('utf-8')
    h.send_response(status)
    h.send_header('Content-Type', 'application/json; charset=utf-8')
    h.send_header('Content-Length', str(len(payload)))
    h.send_header('Cache-Control', 'no-store')
    h.send_header('X-Content-Type-Options', 'nosniff')
    for ck in cookies:
        h.send_header('Set-Cookie', ck)
    for k, v in (extra or {}).items():
        h.send_header(k, v)
    h.end_headers()
    h.wfile.write(payload)


def responder_error(h, status, code, mensaje, campos=None, cookies=(), extra=None):
    cuerpo = {'error': {'code': code, 'message': mensaje}}
    if campos:
        cuerpo['error']['fields'] = campos
    responder(h, status, cuerpo, cookies, extra)


def atender(h, accion):
    """Ejecuta `accion()` y traduce los errores: ErrorPeticion -> su código; cualquier otro -> 500 sin detalle."""
    try:
        accion()
    except ErrorPeticion as e:
        responder_error(h, e.status, e.code, e.mensaje, e.campos)
    except Exception as e:      # nunca se devuelve el detalle al navegador
        print(f'[api] {h.path.split("?")[0]}: {type(e).__name__}: {e}', file=sys.stderr)
        responder_error(h, 500, 'error-servidor', 'No pudimos procesar la solicitud. Inténtalo de nuevo.')


def metodo_no_permitido(permitidos):
    """Devuelve un do_XXX que responde 405 con la cabecera Allow."""
    def _no(h):
        responder_error(h, 405, 'metodo', 'Método no permitido.', extra={'Allow': ', '.join(permitidos)})
    return _no


# ---------------------------------------------------------------- petición
def leer_cuerpo(h, max_bytes=MAX_CUERPO):
    """Lee el cuerpo crudo respetando el tope de tamaño (también si no es JSON)."""
    try:
        largo = int(h.headers.get('Content-Length') or 0)
    except ValueError:
        raise ErrorPeticion(400, 'formato', 'Solicitud inválida.') from None
    if largo > max_bytes:
        raise ErrorPeticion(413, 'muy-grande', 'Solicitud demasiado grande.')
    return h.rfile.read(largo) if largo > 0 else b''


def leer_json(h, max_bytes=MAX_CUERPO):
    if 'application/json' not in (h.headers.get('Content-Type') or '').lower():
        raise ErrorPeticion(415, 'formato', 'Se esperaba JSON.')
    cuerpo = leer_cuerpo(h, max_bytes)
    try:
        datos = json.loads(cuerpo or b'{}')
    except (ValueError, UnicodeDecodeError):
        raise ErrorPeticion(400, 'formato', 'JSON inválido.') from None
    if not isinstance(datos, dict):
        raise ErrorPeticion(400, 'formato', 'JSON inválido.')
    return datos


def exigir_origen(h):
    """Defensa CSRF adicional a SameSite=Lax: el origen debe ser este mismo sitio."""
    origen = h.headers.get('Origin')
    if origen:
        permitidos = [o.strip().rstrip('/') for o in os.environ.get('AUTH_ALLOWED_ORIGINS', '').split(',') if o.strip()]
        valido = urlparse(origen).netloc == h.headers.get('Host') or origen.rstrip('/') in permitidos
    else:
        valido = h.headers.get('Sec-Fetch-Site') in (None, 'same-origin', 'none')
    if not valido:
        raise ErrorPeticion(403, 'origen', 'Solicitud no permitida.')


def ip_cliente(h):
    crudo = ''
    for nombre in ('x-vercel-forwarded-for', 'x-forwarded-for', 'x-real-ip'):
        crudo = (h.headers.get(nombre) or '').split(',')[0].strip()
        if crudo:
            break
    import ipaddress
    try:
        return str(ipaddress.ip_address(crudo))
    except ValueError:
        return None


# ---------------------------------------------------------------- cookie de sesión
def _es_https(h):
    return (h.headers.get('x-forwarded-proto') or '').split(',')[0].strip() == 'https'


def cookie_sesion(h, token, max_age):
    c = f'{COOKIE}={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={max_age}'
    return c + ('; Secure' if _es_https(h) else '')


def token_de(h):
    try:
        c = SimpleCookie(h.headers.get('Cookie', ''))
        return c[COOKIE].value if COOKIE in c else None
    except Exception:
        return None
