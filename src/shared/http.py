"""Utilidades HTTP para funciones serverless de Vercel (BaseHTTPRequestHandler)."""
import json
from http.cookies import SimpleCookie


class HttpError(Exception):
    def __init__(self, status, message, code="error", details=None):
        super().__init__(message)
        self.status = status
        self.message = message
        self.code = code
        self.details = details


def read_json(handler):
    length = int(handler.headers.get("Content-Length") or 0)
    if not length:
        return {}
    try:
        return json.loads(handler.rfile.read(length) or b"{}")
    except ValueError:
        raise HttpError(400, "El cuerpo de la petición no es JSON válido.", "bad_json")


def send_json(handler, status, data=None, cookies=None):
    body = b"" if data is None else json.dumps(data, ensure_ascii=False).encode()
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    for cookie in cookies or []:
        handler.send_header("Set-Cookie", cookie)
    handler.end_headers()
    handler.wfile.write(body)


def get_cookie(handler, name):
    jar = SimpleCookie(handler.headers.get("Cookie", ""))
    return jar[name].value if name in jar else None


def build_cookie(handler, name, value, max_age):
    """Cookie HttpOnly. Secure solo cuando la petición llegó por HTTPS (en local con http no se enviaría)."""
    parts = [f"{name}={value}", "Path=/", "HttpOnly", "SameSite=Lax", f"Max-Age={max_age}"]
    if handler.headers.get("X-Forwarded-Proto", "").split(",")[0].strip() == "https":
        parts.append("Secure")
    return "; ".join(parts)
