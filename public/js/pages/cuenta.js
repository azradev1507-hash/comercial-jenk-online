// Inicio de sesión y registro (comparten lógica de validación y errores).
import { api, ApiError } from '../api.js';
import { toast } from '../components/toast.js';
import { qs, qsa, getParam, safePath } from '../utils/dom.js';
import {
  validateRequired, validateName, validateCedula, validateEmail, validatePhone, validatePassword,
} from '../utils/validate.js';

const form = qs('[data-form]');
if (!form) throw new Error('cuenta.js: no se encontró el formulario');

const modo = form.dataset.form; // 'login' | 'registro'
const alerta = qs('[data-alerta]', form);
const boton = qs('button[type="submit"]', form);

// Reglas por campo: devuelven '' si es válido o el mensaje de error.
const REGLAS = {
  login: {
    email: (v) => validateEmail(v),
    password: (v) => validateRequired(v, 'tu contraseña'),
  },
  registro: {
    first_name: (v) => validateName(v, 'nombre'),
    last_name: (v) => validateName(v, 'apellido'),
    id_number: (v, f) => validateCedula(f.elements.id_type.value, v),
    email: (v) => validateEmail(v),
    phone: (v) => validatePhone(v),
    password: (v) => validatePassword(v),
    password_confirm: (v, f) => (v === f.elements.password.value ? '' : 'Las contraseñas no coinciden.'),
    terms: (v, f) => (f.elements.terms.checked ? '' : 'Acepta los términos para crear tu cuenta.'),
  },
}[modo];

function mostrarError(input, mensaje) {
  const campo = input.closest('.campo');
  const error = qs('.campo__error', campo);
  error.textContent = mensaje;
  error.hidden = !mensaje;
  campo.classList.toggle('campo--error', Boolean(mensaje));
  input.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
}

function validarCampo(nombre) {
  const input = form.elements[nombre];
  const mensaje = REGLAS[nombre](input.value ?? '', form);
  mostrarError(input, mensaje);
  return mensaje;
}

// Devuelve el primer campo inválido (para enfocarlo) o null.
function validarTodo() {
  let primero = null;
  for (const nombre of Object.keys(REGLAS)) {
    if (validarCampo(nombre) && !primero) primero = form.elements[nombre];
  }
  return primero;
}

function mostrarAlerta(mensaje) {
  alerta.textContent = mensaje;
  alerta.hidden = !mensaje;
  if (mensaje) alerta.focus();
}

function ocupado(si) {
  boton.disabled = si;
  boton.setAttribute('aria-busy', String(si));
}

// Validar al salir del campo y limpiar el error mientras se corrige.
for (const nombre of Object.keys(REGLAS)) {
  const input = form.elements[nombre];
  input.addEventListener('blur', () => { if (input.value || input.type === 'checkbox') validarCampo(nombre); });
  input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', () => {
    if (input.closest('.campo--error')) validarCampo(nombre);
  });
}
if (form.elements.id_number) {
  form.elements.id_number.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
}

// Botones "Mostrar / Ocultar" de contraseña
qsa('[data-toggle-password]', form).forEach((b) => {
  b.addEventListener('click', () => {
    const input = qs('input', b.closest('.input-clave'));
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    b.textContent = visible ? 'Ocultar' : 'Mostrar';
    b.setAttribute('aria-pressed', String(visible));
  });
});

function manejarError(err) {
  if (err.details && typeof err.details === 'object') {
    let pintado = false;
    for (const [campo, mensaje] of Object.entries(err.details)) {
      if (form.elements[campo]) { mostrarError(form.elements[campo], mensaje); pintado = true; }
    }
    if (pintado) return form.querySelector('[aria-invalid="true"]')?.focus();
  }
  mostrarAlerta(err instanceof ApiError ? err.message : 'Algo salió mal. Inténtalo de nuevo.');
}

async function enviar() {
  const datos = Object.fromEntries(new FormData(form));
  if (modo === 'login') {
    await api.auth.login({ email: datos.email.trim(), password: datos.password });
    toast('Sesión iniciada.', { type: 'exito' });
    location.assign(safePath(getParam('next'), '/'));
    return;
  }
  const resultado = await api.auth.register({
    first_name: datos.first_name.trim(),
    last_name: datos.last_name.trim(),
    id_type: datos.id_type,
    id_number: datos.id_number,
    email: datos.email.trim(),
    phone: datos.phone.replace(/[\s-]/g, ''),
    password: datos.password,
    accepted_terms: true,
  });
  if (resultado && resultado.verification_sent === false) {
    // Backend provisional: la cuenta queda activa sin verificación por correo.
    qs('[data-exito-titulo]').textContent = 'Cuenta creada';
    qs('[data-exito-texto]').textContent = 'Ya puedes iniciar sesión con tu correo y tu contraseña.';
  } else {
    qs('[data-exito-email]').textContent = datos.email.trim();
  }
  form.hidden = true;
  qs('[data-intro]').hidden = true;
  const exito = qs('[data-exito]');
  exito.hidden = false;
  exito.focus();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mostrarAlerta('');
  const invalido = validarTodo();
  if (invalido) return invalido.focus();
  ocupado(true);
  try {
    await enviar();
  } catch (err) {
    manejarError(err);
  } finally {
    ocupado(false);
  }
});

// Si ya hay sesión, no tiene sentido mostrar el formulario.
api.auth.me().then((user) => { if (user && modo === 'login') location.replace('/'); }).catch(() => {});
