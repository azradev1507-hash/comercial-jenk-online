"""Hash de contraseñas con scrypt (stdlib). Formato: scrypt$n$r$p$salt_b64$hash_b64"""
import base64
import hashlib
import hmac
import os

N, R, P = 2**14, 8, 1


def _b64(raw):
    return base64.b64encode(raw).decode()


def hash_password(password):
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=N, r=R, p=P)
    return f"scrypt${N}${R}${P}${_b64(salt)}${_b64(digest)}"


def verify_password(password, stored):
    try:
        _, n, r, p, salt, digest = stored.split("$")
        expected = base64.b64decode(digest)
        actual = hashlib.scrypt(password.encode(), salt=base64.b64decode(salt), n=int(n), r=int(r), p=int(p))
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(actual, expected)
