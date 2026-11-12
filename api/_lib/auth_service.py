"""Lógica de autenticación: registro, login, sesión y cierre de sesión.
Sin dependencias externas. Contraseñas con scrypt; la sesión es un token aleatorio en una cookie
HttpOnly y en la BD solo se guarda su hash (auth_sessions.refresh_token_hash)."""
import base64
import hashlib
import hmac
import ipaddress
import json
import math
import os
import re
import secrets
import sys
from datetime import date, datetime, timedelta, timezone
from http.cookies import SimpleCookie
from urllib.parse import urlparse

from . import db

COOKIE = 'jenk_session'
SESION_DIAS = 30
VENTANA_MIN = 15
MAX_FALLOS_EMAIL = 5
MAX_FALLOS_IP = 30
EDAD_MINIMA = 18
LIMITE_LAT = (0.6, 12.4)      # caja aproximada de Venezuela (igual que el frontend)
LIMITE_LNG = (-73.5, -59.7)

EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$')
NOMBRE_RE = re.compile(r"^[^\W\d_](?:[^\W\d_]|[\s'.-])*$", re.UNICODE)
CEDULA_RE = re.compile(r'^\d{6,9}$')
MOVIL_RE = re.compile(r'^04(12|14|16|22|24|26)\d{7}$')


# ---------------------------------------------------------------- respuestas
def _resp(status, data=None, cookies=()):
    headers = [('Content-Type', 'application/json; charset=utf-8'), ('Cache-Control', 'no-store')]
    headers += [('Set-Cookie', c) for c in cookies]
    return status, headers, json.dumps(data if data is not None else {}, ensure_ascii=False).encode()


def _error(status, code, mensaje, campos=None, cookies=()):
    cuerpo = {'error': {'code': code, 'message': mensaje}}
    if campos:
        cuerpo['error']['fields'] = campos
    return _resp(status, cuerpo, cookies)


# ---------------------------------------------------------------- contraseñas
_N, _R, _P = 2 ** 14, 8, 1


def hash_password(clave):
    sal = secrets.token_bytes(16)
    h = hashlib.scrypt(clave.encode(), salt=sal, n=_N, r=_R, p=_P, dklen=32)
    b64 = lambda b: base64.b64encode(b).decode()
    return f'scrypt${_N}${_R}${_P}${b64(sal)}${b64(h)}'


def verify_password(clave, guardado):
    try:
        alg, n, r, p, sal, esperado = guardado.split('$')
        if alg != 'scrypt':
            return False
        sal, esperado = base64.b64decode(sal), base64.b64decode(esperado)
        h = hashlib.scrypt(clave.encode(), salt=sal, n=int(n), r=int(r), p=int(p), dklen=len(esperado),
                           maxmem=128 * int(n) * int(r) * 2)
        return hmac.compare_digest(h, esperado)
    except Exception:
        return False


_dummy = None


def _hash_falso():
    """Para gastar el mismo tiempo cuando el correo no existe (evita adivinar cuentas por tiempo)."""
    global _dummy
    if _dummy is None:
        _dummy = hash_password('no-existe')
    return _dummy


# ---------------------------------------------------------------- utilidades
def _ahora():
    return datetime.now(timezone.utc)


def _iso(dt):
    return dt.isoformat().replace('+00:00', 'Z')


def _hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


def _ip(headers):
    crudo = (headers.get('x-forwarded-for') or headers.get('x-real-ip') or '').split(',')[0].strip()
    try:
        return str(ipaddress.ip_address(crudo))
    except ValueError:
        return None


def _es_https(headers):
    return (headers.get('x-forwarded-proto') or '').split(',')[0].strip() == 'https'


def _cookie_sesion(token, headers, max_age):
    c = f'{COOKIE}={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={max_age}'
    return c + ('; Secure' if _es_https(headers) else '')


def _token_de(headers):
    try:
        c = SimpleCookie(headers.get('cookie', ''))
        return c[COOKIE].value if COOKIE in c else None
    except Exception:
        return None


def _origen_valido(headers):
    """Defensa CSRF adicional a SameSite=Lax: el origen debe ser este mismo sitio."""
    origen = headers.get('origin')
    if origen:
        permitidos = [o.strip() for o in os.environ.get('AUTH_ALLOWED_ORIGINS', '').split(',') if o.strip()]
        return urlparse(origen).netloc == headers.get('host') or origen in permitidos
    sitio = headers.get('sec-fetch-site')
    return sitio in (None, 'same-origin', 'none')


def _nombre_visible(cuenta):
    return f"{cuenta.get('first_name', '')} {cuenta.get('last_name', '')}".strip()


def _usuario(cuenta):
    return {'id': cuenta['id'], 'nombre': _nombre_visible(cuenta), 'email': cuenta['email']}


def _normalizar_telefono(v):
    t = re.sub(r'[\s\-().]', '', v)
    if t.startswith('+58'):
        t = '0' + t[3:]
    elif t.startswith('58') and len(t) == 12:
        t = '0' + t[2:]
    return t


def _edad(nac, hoy):
    return hoy.year - nac.year - ((hoy.month, hoy.day) < (nac.month, nac.day))


# ---------------------------------------------------------------- validación
def validar_registro(p):
    """Mismas reglas que el formulario (el servidor nunca confía en el navegador)."""
    err, d = {}, {}
    txt = lambda k: p.get(k).strip() if isinstance(p.get(k), str) else ''

    for k, etiqueta in (('first_name', 'nombre'), ('last_name', 'apellido')):
        v = re.sub(r'\s+', ' ', txt(k))
        if not v:
            err[k] = f'Escribe tu {etiqueta}.'
        elif len(v) < 2 or len(v) > 60 or not NOMBRE_RE.match(v):
            err[k] = 'Usa solo letras (mínimo 2).'
        else:
            d[k] = v

    d['id_type'] = txt('id_type')
    if d['id_type'] not in ('V', 'E'):
        err['id_type'] = 'Tipo de cédula inválido.'
    d['id_number'] = txt('id_number')
    if not CEDULA_RE.match(d['id_number']):
        err['id_number'] = 'La cédula debe tener entre 6 y 9 números.'

    try:
        nac = date.fromisoformat(txt('birth_date'))
        if nac < date(1900, 1, 1) or nac > _ahora().date():
            raise ValueError
        if _edad(nac, _ahora().date()) < EDAD_MINIMA:
            err['birth_date'] = f'Debes tener al menos {EDAD_MINIMA} años para crear una cuenta.'
        d['birth_date'] = nac.isoformat()
    except ValueError:
        err['birth_date'] = 'Revisa la fecha de nacimiento.'

    d['email'] = txt('email').lower()
    if len(d['email']) > 120 or not EMAIL_RE.match(d['email']):
        err['email'] = 'Revisa el correo: debe verse como nombre@dominio.com.'

    d['phone'] = _normalizar_telefono(txt('phone'))
    if not MOVIL_RE.match(d['phone']):
        err['phone'] = 'Revisa el teléfono: por ejemplo 0414 1234567.'

    d['address'] = re.sub(r'\s+', ' ', txt('address'))
    if len(d['address']) < 10 or len(d['address']) > 250:
        err['address'] = 'Agrega más detalle a la dirección (calle, casa o edificio).'
    d['address_ref'] = txt('address_ref')[:120]

    la, lo = p.get('latitude'), p.get('longitude')
    numeros = all(isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) for x in (la, lo))
    if not numeros or not (LIMITE_LAT[0] <= la <= LIMITE_LAT[1] and LIMITE_LNG[0] <= lo <= LIMITE_LNG[1]):
        err['latitude'] = 'Marca tu ubicación en el mapa, dentro de Venezuela.'
    else:
        d['latitude'], d['longitude'] = round(float(la), 6), round(float(lo), 6)

    clave = p.get('password')
    if not isinstance(clave, str) or len(clave) < 8 or len(clave) > 128 \
            or not re.search(r'[^\W\d_]', clave) or not re.search(r'\d', clave):
        err['password'] = 'Usa al menos 8 caracteres, con una letra y un número.'
    else:
        d['password'] = clave
    return d, err


# ---------------------------------------------------------------- sesión
def _abrir_sesion(user_id, headers):
    token = secrets.token_urlsafe(32)
    db.crear_sesion(user_id, _hash_token(token), headers.get('user-agent'), _ip(headers),
                    _iso(_ahora() + timedelta(days=SESION_DIAS)))
    return _cookie_sesion(token, headers, SESION_DIAS * 86400)


# ---------------------------------------------------------------- acciones
def registrar(headers, p):
    d, err = validar_registro(p)
    if err:
        return _error(422, 'validacion', 'Revisa los datos del formulario.', err)
    r = db.rpc('auth_register_user', {
        'p_email': d['email'], 'p_phone': d['phone'], 'p_password_hash': hash_password(d['password']),
        'p_first_name': d['first_name'], 'p_last_name': d['last_name'],
        'p_document_type': d['id_type'], 'p_document_number': d['id_number'],
        'p_birth_date': d['birth_date'], 'p_address_line1': d['address'],
        'p_reference': d['address_ref'], 'p_latitude': d['latitude'], 'p_longitude': d['longitude'],
        'p_status': 'active',   # pasar a 'pending' cuando exista el envío de correo de verificación
    })
    if not r.get('ok'):
        mensajes = {'email-existe': 'Ya existe una cuenta con este correo.',
                    'cedula-existe': 'Ya existe una cuenta con esta cédula.'}
        codigo = r.get('code', 'duplicado')
        return _error(409, codigo, mensajes.get(codigo, 'Ya existe una cuenta con esos datos.'))
    cookie = _abrir_sesion(r['user_id'], headers)
    usuario = {'id': r['user_id'], 'nombre': f"{d['first_name']} {d['last_name']}", 'email': d['email']}
    return _resp(201, {'user': usuario, 'verificacion': False}, [cookie])


def iniciar_sesion(headers, p):
    email = p.get('email').strip().lower() if isinstance(p.get('email'), str) else ''
    clave = p.get('password') if isinstance(p.get('password'), str) else ''
    ip = _ip(headers)
    desde = _iso(_ahora() - timedelta(minutes=VENTANA_MIN))

    if email and (db.contar_fallos(desde, email=email) >= MAX_FALLOS_EMAIL
                  or (ip and db.contar_fallos(desde, ip=ip) >= MAX_FALLOS_IP)):
        return _error(429, 'demasiados-intentos', 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.')

    cuenta = db.cuenta_por_email(email) if EMAIL_RE.match(email) and len(email) <= 120 and len(clave) <= 128 else None
    hash_guardado = (cuenta or {}).get('password_hash')
    ok = verify_password(clave, hash_guardado or _hash_falso())
    if not (cuenta and hash_guardado and ok):
        if email:
            db.registrar_intento(email, ip, False)
        return _error(401, 'credenciales', 'Correo o contraseña incorrectos.')
    if cuenta['status'] != 'active':
        db.registrar_intento(email, ip, False)
        return _error(403, 'cuenta-inactiva', 'Esta cuenta no está activa.')

    db.registrar_intento(email, ip, True)
    db.marcar_login(cuenta['id'], _iso(_ahora()))
    return _resp(200, {'user': _usuario(cuenta)}, [_abrir_sesion(cuenta['id'], headers)])


def yo(headers):
    token = _token_de(headers)
    if token:
        s = db.sesion_vigente(_hash_token(token), _iso(_ahora()))
        cuenta = db.cuenta_por_id(s['user_id']) if s else None
        if cuenta and cuenta['status'] == 'active':
            return _resp(200, {'user': _usuario(cuenta)})
    return _resp(200, {'user': None})


def cerrar_sesion(headers):
    token = _token_de(headers)
    if token:
        db.revocar_sesion(_hash_token(token), _iso(_ahora()))
    return _resp(200, {'ok': True}, [_cookie_sesion('', headers, 0)])


# ---------------------------------------------------------------- entrada
def manejar(metodo, accion, headers, cuerpo):
    """headers con claves en minúsculas. Devuelve (status, [(header, valor)], bytes)."""
    try:
        if accion == 'me' and metodo == 'GET':
            return yo(headers)
        if accion in ('register', 'login', 'logout') and metodo == 'POST':
            if not _origen_valido(headers):
                return _error(403, 'origen', 'Solicitud no permitida.')
            if accion == 'logout':
                return cerrar_sesion(headers)
            if 'application/json' not in (headers.get('content-type') or ''):
                return _error(415, 'formato', 'Se esperaba JSON.')
            try:
                datos = json.loads(cuerpo or b'{}')
            except ValueError:
                datos = None
            if not isinstance(datos, dict):
                return _error(400, 'formato', 'JSON inválido.')
            return registrar(headers, datos) if accion == 'register' else iniciar_sesion(headers, datos)
        if accion in ('me', 'register', 'login', 'logout'):
            return _error(405, 'metodo', 'Método no permitido.')
        return _error(404, 'no-encontrado', 'Ruta no encontrada.')
    except Exception as e:           # nunca se devuelve el detalle al navegador
        print(f'[auth] error en {accion}: {type(e).__name__}: {e}', file=sys.stderr)
        return _error(500, 'error-servidor', 'No pudimos procesar la solicitud. Inténtalo de nuevo.')
