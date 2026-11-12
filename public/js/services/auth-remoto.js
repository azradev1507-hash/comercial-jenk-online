// Autenticación contra el backend (/api/auth/*). La sesión vive en una cookie HttpOnly que pone el
// servidor: el navegador no ve ni guarda tokens ni datos del usuario. Mismo contrato que mock/auth-local.js.
// Para que otras pestañas se enteren de un ingreso o una salida (no escribe nada en localStorage)
const canal = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('jenk-auth');

function fallo(code, message, fields) {
  const e = new Error(message);
  e.code = code;
  if (fields) e.fields = fields;
  return e;
}

async function pedir(ruta, { method = 'GET', body } = {}) {
  let r;
  try {
    r = await fetch(`/api/auth/${ruta}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw fallo('red', 'Sin conexión con el servidor.');
  }
  let datos = null;
  try { datos = await r.json(); } catch { /* respuesta sin cuerpo JSON */ }
  if (!r.ok) throw fallo(datos?.error?.code ?? 'error-servidor', datos?.error?.message ?? 'Error del servidor.', datos?.error?.fields);
  return datos;
}

const avisar = () => canal?.postMessage('cambio');

export const authRemoto = {
  async register(datos) {
    const r = await pedir('register', { method: 'POST', body: datos });
    avisar();
    return { ...r.user, verificacion: Boolean(r.verificacion) };
  },
  async login({ email, password }) {
    const r = await pedir('login', { method: 'POST', body: { email, password } });
    avisar();
    return r.user;
  },
  async logout() {
    await pedir('logout', { method: 'POST', body: {} });
    avisar();
  },
  async me() {
    try { return (await pedir('me')).user; } catch { return null; }
  },
  onChange(cb) {
    if (!canal) return () => {};
    const f = () => cb();
    canal.addEventListener('message', f);
    return () => canal.removeEventListener('message', f);
  },
};
