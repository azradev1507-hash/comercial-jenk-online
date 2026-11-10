// Preferencias NO sensibles. Nunca guardar tokens ni datos personales aquí.
export function readJson(key, fallback = null, area = 'sessionStorage') {
  try {
    const raw = window[area].getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key, value, area = 'sessionStorage') {
  try {
    window[area].setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento bloqueado o lleno: se ignora */
  }
}

export function remove(key, area = 'sessionStorage') {
  try {
    window[area].removeItem(key);
  } catch {
    /* ignorado */
  }
}
