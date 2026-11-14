"""POST /api/register — crea la cuenta (perfil, dirección y rol en una transacción) y abre sesión."""
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _auth as a  # noqa: E402
import _comun as c  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args):   # sin log por petición
        pass

    def do_POST(self):
        c.atender(self, lambda: a.registrar(self))

    do_GET = do_PUT = do_PATCH = do_DELETE = c.metodo_no_permitido(["POST"])
