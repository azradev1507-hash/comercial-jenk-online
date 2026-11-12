# Endpoint: GET /api/auth/me
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from _lib.http_util import atender  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        atender(self, 'me')

    def do_POST(self):
        atender(self, 'me')

    def log_message(self, *args):
        pass
