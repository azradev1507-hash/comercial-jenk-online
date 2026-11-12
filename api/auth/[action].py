# Endpoints: POST /api/auth/register · POST /api/auth/login · POST /api/auth/logout · GET /api/auth/me
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from _lib.auth_service import manejar  # noqa: E402

MAX_CUERPO = 20_000


class handler(BaseHTTPRequestHandler):
    def _atender(self, metodo):
        accion = self.path.split('?')[0].rstrip('/').rsplit('/', 1)[-1]
        largo = int(self.headers.get('content-length') or 0)
        if largo > MAX_CUERPO:
            return self._enviar(413, [('Content-Type', 'application/json')],
                                b'{"error":{"code":"muy-grande","message":"Solicitud demasiado grande."}}')
        cuerpo = self.rfile.read(largo) if largo else b''
        cabeceras = {k.lower(): v for k, v in self.headers.items()}
        self._enviar(*manejar(metodo, accion, cabeceras, cuerpo))

    def _enviar(self, status, cabeceras, cuerpo):
        self.send_response(status)
        for k, v in cabeceras:
            self.send_header(k, v)
        self.send_header('Content-Length', str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def do_GET(self):
        self._atender('GET')

    def do_POST(self):
        self._atender('POST')

    def log_message(self, *args):
        pass
