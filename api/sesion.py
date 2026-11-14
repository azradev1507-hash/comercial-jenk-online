"""GET  /api/sesion -> usuario de la sesión actual (o {"user": null})
POST /api/sesion -> cierra la sesión (se unió a /me y /logout para ahorrar funciones: el plan Hobby de
                    Vercel permite 12 por proyecto)."""
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _auth as a  # noqa: E402
import _comun as c  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        c.atender(self, lambda: a.quien_soy(self))

    def do_POST(self):
        c.atender(self, lambda: a.cerrar_sesion(self))

    do_PUT = do_PATCH = do_DELETE = c.metodo_no_permitido(["GET", "POST"])
