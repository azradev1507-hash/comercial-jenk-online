"""Puente entre BaseHTTPRequestHandler (lo que Vercel ejecuta) y la lógica de auth_service."""
from .auth_service import manejar

MAX_CUERPO = 20_000


def _enviar(h, status, cabeceras, cuerpo):
    h.send_response(status)
    for k, v in cabeceras:
        h.send_header(k, v)
    h.send_header('Content-Length', str(len(cuerpo)))
    h.end_headers()
    h.wfile.write(cuerpo)


def atender(h, accion):
    """h = el handler de Vercel; accion = 'register' | 'login' | 'logout' | 'me'."""
    largo = int(h.headers.get('content-length') or 0)
    if largo > MAX_CUERPO:
        return _enviar(h, 413, [('Content-Type', 'application/json')],
                       b'{"error":{"code":"muy-grande","message":"Solicitud demasiado grande."}}')
    cuerpo = h.rfile.read(largo) if largo else b''
    cabeceras = {k.lower(): v for k, v in h.headers.items()}
    _enviar(h, *manejar(h.command, accion, cabeceras, cuerpo))
