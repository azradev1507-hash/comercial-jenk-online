"""Acceso a datos del módulo users (tabla users_accounts)."""
from ...shared import db

TABLE = "users_accounts"


def find_by_email(email):
    rows = db.select(TABLE, {"email": f"eq.{email}", "limit": "1"})
    return rows[0] if rows else None


def find_by_id(user_id):
    rows = db.select(TABLE, {"id": f"eq.{user_id}", "limit": "1"})
    return rows[0] if rows else None


def insert(row):
    return db.insert(TABLE, row)
