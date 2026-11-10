"""Acceso a datos del módulo auth (tabla auth_sessions). Solo se guarda el hash del token."""
from datetime import datetime, timezone

from ...shared import db

TABLE = "auth_sessions"


def insert(user_id, token_hash, expires_at):
    return db.insert(TABLE, {"user_id": user_id, "token_hash": token_hash, "expires_at": expires_at.isoformat()})


def find_active(token_hash):
    now = datetime.now(timezone.utc).isoformat()
    rows = db.select(TABLE, {"token_hash": f"eq.{token_hash}", "expires_at": f"gt.{now}", "limit": "1"})
    return rows[0] if rows else None


def delete(token_hash):
    db.delete(TABLE, {"token_hash": f"eq.{token_hash}"})
