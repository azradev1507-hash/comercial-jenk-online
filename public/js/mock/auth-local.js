// Sesión SIMULADA para desarrollar sin backend (se activa con localStorage.setItem('jenk.mock','1')).
// Mismo contrato que services/auth-remoto.js. No es seguro: no usar en producción.
const U = 'jenk.mock.usuarios', S = 'jenk.mock.sesion';
const canal = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('jenk-auth');
const leer = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v; } catch { return v; } };
const fallo = (code, message, fields) => Object.assign(new Error(message), { code, fields });
const avisar = () => canal?.postMessage('cambio');

export const authLocal = {
  async register(d) {
    const usuarios = leer(U, []);
    if (usuarios.some((u) => u.email === String(d.email).trim().toLowerCase())) {
      throw fallo('email-existente', 'Ese correo ya tiene una cuenta.', { email: 'Ese correo ya tiene una cuenta.' });
    }
    const user = { id: crypto.randomUUID(), nombre: `${d.first_name} ${d.last_name}`.trim(), email: String(d.email).trim().toLowerCase() };
    localStorage.setItem(U, JSON.stringify([...usuarios, { ...user, password: d.password }]));
    localStorage.setItem(S, JSON.stringify(user));
    avisar();
    return { ...user, verificacion: false };
  },
  async login({ email, password }) {
    const u = leer(U, []).find((x) => x.email === String(email).trim().toLowerCase() && x.password === password);
    if (!u) throw fallo('credenciales', 'Correo o contraseña incorrectos.');
    const { password: _omitida, ...user } = u;
    localStorage.setItem(S, JSON.stringify(user));
    avisar();
    return user;
  },
  async recover() { return { ok: true }; },
  async logout() { localStorage.removeItem(S); avisar(); },
  async me() { return leer(S, null); },
  onChange(cb) {
    if (!canal) return () => {};
    const f = () => cb();
    canal.addEventListener('message', f);
    return () => canal.removeEventListener('message', f);
  },
};
