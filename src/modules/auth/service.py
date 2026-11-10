"""Lógica de negocio de autenticación (versión provisional: validaciones mínimas)."""
import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone

from ...shared.config import SESSION_DAYS
from ...shared.http import HttpError
from ..users import public as users
from . import passwords, repository

CAMPOS_REGISTRO = ("first_name", "last_name", "id_type", "id_number", "email", "phone", "password")


def _hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


def _normalize_email(value):
    return (value or "").strip().lower()


def _open_session(user_id):
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
    repository.insert(user_id, _hash_token(token), expires)
    return token


def register(data):
    faltan = {c: "Este campo es obligatorio." for c in CAMPOS_REGISTRO if not str(data.get(c) or "").strip()}
    if faltan:
        raise HttpError(422, "Completa todos los campos.", "validation", faltan)
    email = _normalize_email(data["email"])
    if "@" not in email:
        raise HttpError(422, "Revisa el correo.", "validation", {"email": "El correo no es válido."})
    if len(data["password"]) < 8:
        raise HttpError(422, "Revisa la contraseña.", "validation", {"password": "Debe tener al menos 8 caracteres."})
    id_type = str(data["id_type"]).upper()
    if id_type not in ("V", "E"):
        raise HttpError(422, "Revisa la cédula.", "validation", {"id_number": "Elige V o E."})

    try:
        account = users.create_account({
            "email": email,
            "password_hash": passwords.hash_password(data["password"]),
            "first_name": data["first_name"].strip(),
            "last_name": data["last_name"].strip(),
            "id_type": id_type,
            "id_number": re.sub(r"\D", "", str(data["id_number"])),
            "phone": re.sub(r"[\s-]", "", str(data["phone"])),
        })
    except users.DuplicateAccount as dup:
        mensajes = {"email": "Ya existe una cuenta con este correo.", "id_number": "Ya existe una cuenta con esta cédula."}
        raise HttpError(409, "No pudimos crear la cuenta.", "conflict", {dup.field: mensajes[dup.field]})
    return {"id": account["id"], "email": account["email"], "verification_sent": False}


def login(data):
    email = _normalize_email(data.get("email"))
    account = users.get_by_email(email) if email else None
    # Se verifica siempre (aunque no exista la cuenta) para no revelar qué correos están registrados.
    stored = account["password_hash"] if account else "scrypt$16384$8$1$AAAA$AAAA"
    ok = passwords.verify_password(data.get("password") or "", stored)
    if not account or not ok:
        raise HttpError(401, "Correo o contraseña incorrectos.", "invalid_credentials")
    return _open_session(account["id"]), users.public_view(account)


def logout(token):
    if token:
        repository.delete(_hash_token(token))


def current_user(token):
    """Devuelve el usuario de la sesión o None. Es la base de la autorización de los demás endpoints."""
    if not token:
        return None
    session = repository.find_active(_hash_token(token))
    if not session:
        return None
    account = users.get_by_id(session["user_id"])
    return users.public_view(account) if account else None
