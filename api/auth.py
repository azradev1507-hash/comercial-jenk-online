# Función serverless de Vercel: solo delega en el módulo auth (sin lógica aquí).
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.modules.auth import router  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        router.dispatch(self)

    def do_POST(self):
        router.dispatch(self)
