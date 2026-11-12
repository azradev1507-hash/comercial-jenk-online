"""Acceso a Supabase por PostgREST con la service role key (solo servidor).
Variables de entorno (Vercel): SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
Solo biblioteca estándar: no hace falta requirements.txt."""
import json
import os
import urllib.error
import urllib.request
from urllib.parse import quote

TIMEOUT = 8


class DbError(Exception):
    def __init__(self, status, detalle):
        super().__init__(f'Supabase {status}: {detalle}')
        self.status = status


def _config():
    url = os.environ.get('SUPABASE_URL', '').rstrip('/')
    clave = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if not url or not clave:
        raise RuntimeError('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
    return url, clave


def _pedir(metodo, ruta, *, cuerpo=None, extra=None):
    url, clave = _config()
    headers = {'apikey': clave, 'Accept': 'application/json'}
    if not clave.startswith('sb_'):          # las claves nuevas (sb_secret_...) no son JWT
        headers['Authorization'] = f'Bearer {clave}'
    if cuerpo is not None:
        headers['Content-Type'] = 'application/json'
    headers.update(extra or {})
    data = json.dumps(cuerpo).encode() if cuerpo is not None else None
    req = urllib.request.Request(f'{url}/rest/v1/{ruta}', data=data, headers=headers, method=metodo)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            crudo = r.read()
            return r.status, dict(r.headers), (json.loads(crudo) if crudo else None)
    except urllib.error.HTTPError as e:
        raise DbError(e.code, e.read().decode(errors='replace')[:300]) from None
    except urllib.error.URLError as e:
        raise DbError(0, str(e.reason)) from None


def _q(valor):
    return quote(str(valor), safe='')


# ---------- Operaciones usadas por la autenticación ----------

def rpc(nombre, parametros):
    return _pedir('POST', f'rpc/{nombre}', cuerpo=parametros)[2]


def cuenta_por_email(email):
    """Cuenta + nombre del perfil, o None."""
    _, _, filas = _pedir('GET', f'users_accounts?email=eq.{_q(email)}&limit=1'
                                '&select=id,email,password_hash,status,users_profiles(first_name,last_name)')
    return _con_perfil(filas[0]) if filas else None


def cuenta_por_id(user_id):
    _, _, filas = _pedir('GET', f'users_accounts?id=eq.{_q(user_id)}&limit=1'
                                '&select=id,email,status,users_profiles(first_name,last_name)')
    return _con_perfil(filas[0]) if filas else None


def _con_perfil(fila):
    perfil = fila.pop('users_profiles', None)
    if isinstance(perfil, list):             # PostgREST devuelve objeto en 1:1, lista si no lo infiere
        perfil = perfil[0] if perfil else None
    fila['first_name'] = (perfil or {}).get('first_name', '')
    fila['last_name'] = (perfil or {}).get('last_name', '')
    return fila


def contar_fallos(desde_iso, *, email=None, ip=None):
    filtro = f'success=eq.false&created_at=gte.{_q(desde_iso)}'
    if email:
        filtro += f'&email=eq.{_q(email)}'
    if ip:
        filtro += f'&ip=eq.{_q(ip)}'
    _, headers, _ = _pedir('GET', f'auth_login_attempts?select=id&{filtro}',
                           extra={'Prefer': 'count=exact', 'Range': '0-0'})
    rango = next((v for k, v in headers.items() if k.lower() == 'content-range'), '*/0')
    return int(rango.split('/')[-1] or 0)


def registrar_intento(email, ip, exito):
    _pedir('POST', 'auth_login_attempts', cuerpo={'email': email, 'ip': ip, 'success': exito},
           extra={'Prefer': 'return=minimal'})


def marcar_login(user_id, ahora_iso):
    _pedir('PATCH', f'users_accounts?id=eq.{_q(user_id)}', cuerpo={'last_login_at': ahora_iso},
           extra={'Prefer': 'return=minimal'})


def crear_sesion(user_id, token_hash, user_agent, ip, expira_iso):
    _pedir('POST', 'auth_sessions', extra={'Prefer': 'return=minimal'},
           cuerpo={'user_id': user_id, 'refresh_token_hash': token_hash,
                   'user_agent': (user_agent or '')[:300] or None, 'ip': ip, 'expires_at': expira_iso})


def sesion_vigente(token_hash, ahora_iso):
    _, _, filas = _pedir('GET', f'auth_sessions?refresh_token_hash=eq.{_q(token_hash)}'
                                f'&revoked_at=is.null&expires_at=gt.{_q(ahora_iso)}&limit=1&select=id,user_id')
    return filas[0] if filas else None


def revocar_sesion(token_hash, ahora_iso):
    _pedir('PATCH', f'auth_sessions?refresh_token_hash=eq.{_q(token_hash)}&revoked_at=is.null',
           cuerpo={'revoked_at': ahora_iso}, extra={'Prefer': 'return=minimal'})
