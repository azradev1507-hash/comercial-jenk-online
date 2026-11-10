"""Única interfaz que otros módulos pueden importar de users."""
from ...shared.db import DbError
from . import repository


class DuplicateAccount(Exception):
    def __init__(self, field):
        super().__init__(field)
        self.field = field  # 'email' | 'id_number'


def get_by_email(email):
    return repository.find_by_email(email)


def get_by_id(user_id):
    return repository.find_by_id(user_id)


def create_account(row):
    try:
        return repository.insert(row)
    except DbError as err:
        if err.code == "23505":  # unique_violation
            raise DuplicateAccount("email" if "email" in err.text else "id_number") from None
        raise


def public_view(account):
    """Datos que sí pueden viajar al navegador (nunca password_hash)."""
    return {
        "id": account["id"],
        "first_name": account["first_name"],
        "last_name": account["last_name"],
        "email": account["email"],
    }
