"""Cliente mínimo de Supabase (PostgREST) sin dependencias externas.
Siempre usa la clave SECRETA: las tablas tienen RLS activo sin políticas, así que la anon key no puede leer ni escribir."""
import json
import urllib.error
import urllib.parse
import urllib.request

from .config import supabase_secret_key, supabase_url


class DbError(Exception):
    def __init__(self, status, body):
        super().__init__(f"Supabase {status}: {body}")
        self.status = status
        self.body = body if isinstance(body, dict) else {"message": str(body)}

    @property
    def code(self):
        return self.body.get("code")

    @property
    def text(self):
        return f"{self.body.get('message', '')} {self.body.get('details', '')}"


def _headers(prefer=None):
    key = supabase_secret_key()
    headers = {"apikey": key, "Content-Type": "application/json", "Accept": "application/json"}
    # Las claves legadas (service_role) son JWT y van también como Bearer; las nuevas sb_secret_* no.
    if key.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {key}"
    if prefer:
        headers["Prefer"] = prefer
    return headers


def _request(method, table, query=None, body=None, prefer=None):
    url = f"{supabase_url()}/rest/v1/{table}"
    if query:
        url += "?" + urllib.parse.urlencode(query)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=_headers(prefer))
    try:
        with urllib.request.urlopen(req, timeout=8) as res:
            raw = res.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as err:
        raw = err.read().decode(errors="replace")
        try:
            raise DbError(err.code, json.loads(raw)) from None
        except ValueError:
            raise DbError(err.code, raw) from None


def select(table, query):
    """query en sintaxis PostgREST, p. ej. {"email": "eq.a@b.com", "limit": "1"}"""
    return _request("GET", table, query={"select": "*", **query})


def insert(table, row):
    rows = _request("POST", table, body=row, prefer="return=representation")
    return rows[0] if rows else None


def delete(table, query):
    _request("DELETE", table, query=query)
