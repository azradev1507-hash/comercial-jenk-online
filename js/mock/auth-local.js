// Autenticación SIMULADA en el navegador (localStorage). Sirve para armar y probar las pantallas
// mientras no exista /api/auth. NO es seguridad real: cualquiera con acceso al navegador puede leer
// o editar estos datos. Cuando haya backend, api.auth pasa a hacer fetch y este archivo se borra.
const KEY_USERS = 'jenk.users';
const KEY_SESSION = 'jenk.session';

// Respaldo en memoria si localStorage no está disponible (modo privado, bloqueado por el usuario)
const memoria = new Map();
function leer(key, vacio) {
  try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw); } catch {}
  return memoria.has(key) ? memoria.get(key) : vacio;
}
function guardar(key, valor) {
  memoria.set(key, valor);
  try { localStorage.setItem(key, JSON.stringify(valor)); } catch {}
}
function borrar(key) {
  memoria.delete(key);
  try { localStorage.removeItem(key); } catch {}
}

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

// La contraseña nunca se guarda en texto plano (SHA-256 con sal)
async function hashClave(clave, sal) {
  if (globalThis.crypto?.subtle) return hex(await crypto.subtle.digest('SHA-256', enc.encode(sal + clave)));
  // http fuera de localhost: no hay crypto.subtle. Solo ocurre en pruebas desde otro equipo de la red.
  return 'plano:' + btoa(String.fromCharCode(...enc.encode(sal + clave)));
}

const limpiarEmail = (e) => String(e ?? '').trim().toLowerCase();
const publico = ({ id, nombre, email }) => ({ id, nombre, email });
function fallo(code, message) { const e = new Error(message); e.code = code; return e; }

// Contrato que debe respetar el backend real:
//   register({ first_name, last_name, id_type, id_number, birth_date, email, phone,
//             address, address_ref, latitude, longitude, password })
//                                         → { id, nombre, email[, verificacion] } | error code 'email-existe' | 'cedula-existe'
//   login({ email, password })            → { id, nombre, email }   | error code 'credenciales'
//   logout()                              → void
//   me()                                  → { id, nombre, email } | null
//   onChange(cb)                          → función para dejar de escuchar (sesión cambió en otra pestaña)
export const authLocal = {
  async register({ first_name, last_name, id_type, id_number, birth_date, email, phone, address, address_ref, latitude, longitude, password }) {
    const users = leer(KEY_USERS, []);
    const correo = limpiarEmail(email);
    if (users.some(u => u.email === correo)) throw fallo('email-existe', 'Ya existe una cuenta con este correo.');
    if (users.some(u => u.id_type === id_type && u.id_number === id_number)) throw fallo('cedula-existe', 'Ya existe una cuenta con esta cédula.');
    const sal = hex(crypto.getRandomValues(new Uint8Array(16)));
    const user = {
      id: sal.slice(0, 12),
      nombre: `${String(first_name).trim()} ${String(last_name).trim()}`,
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      id_type,
      id_number,
      birth_date,
      phone,
      address,
      address_ref,
      latitude,
      longitude,
      email: correo,
      sal,
      clave: await hashClave(password, sal),
      creado: new Date().toISOString(),
    };
    guardar(KEY_USERS, [...users, user]);
    guardar(KEY_SESSION, publico(user));
    // Con backend real: { ...publico, verificacion: true } si hay que verificar el correo antes de entrar
    return publico(user);
  },

  async login({ email, password }) {
    const correo = limpiarEmail(email);
    const user = leer(KEY_USERS, []).find(u => u.email === correo);
    if (!user || user.clave !== await hashClave(password, user.sal)) {
      throw fallo('credenciales', 'Correo o contraseña incorrectos.');
    }
    guardar(KEY_SESSION, publico(user));
    return publico(user);
  },

  async logout() { borrar(KEY_SESSION); },

  async me() { return leer(KEY_SESSION, null); },

  onChange(cb) {
    const f = (e) => { if (e.key === KEY_SESSION || e.key === null) cb(); };
    addEventListener('storage', f);
    return () => removeEventListener('storage', f);
  },
};
