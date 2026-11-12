// Login y registro. Un solo módulo: según data-form del <form> se activa una pantalla u otra.
import { api } from '../api.js';
import { h } from '../utils/dom.js';
import { initMapPicker, dentroDeVenezuela } from '../components/map-picker.js';
import { EMAIL_RE, setError, setFormError, setBusy, clearOnInput, initPasswordToggles, safeNext, carryNext } from '../utils/forms.js';

const NOMBRE_RE = /^\p{L}[\p{L}\s'.-]*$/u;
const CEDULA_RE = /^\d{6,9}$/;
const MOVIL_RE = /^04(12|14|16|22|24|26)\d{7}$/;
const EDAD_MINIMA = 18;

// Años cumplidos a una fecha 'YYYY-MM-DD' (sin zonas horarias)
function edadDe(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  const hoy = new Date();
  let edad = hoy.getFullYear() - a;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) edad--;
  return edad;
}
const isoHaceAnios = (n) => {
  const f = new Date();
  f.setFullYear(f.getFullYear() - n);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
};

// Acepta 0414 1234567, 0414-1234567, +58 414 1234567, 584141234567… y lo deja como 04141234567
function normalizarTelefono(valor) {
  let t = valor.replace(/[\s\-().]/g, '');
  if (t.startsWith('+58')) t = '0' + t.slice(3);
  else if (t.startsWith('58') && t.length === 12) t = '0' + t.slice(2);
  return t;
}

// Marca el error y recuerda el primer campo inválido para llevar el foco ahí
function validador(campos) {
  campos.forEach((c) => setError(c, ''));
  let primero = null;
  return {
    marcar(campo, msg) { setError(campo, msg); primero ??= campo; },
    get primero() { return primero; },
  };
}

function iniciarLogin(form) {
  const { email, password } = form.elements;

  function validar() {
    const v = validador([email, password]);
    if (!email.value.trim()) v.marcar(email, 'Escribe tu correo.');
    else if (!EMAIL_RE.test(email.value.trim())) v.marcar(email, 'Revisa el correo: debe verse como nombre@dominio.com.');
    if (!password.value) v.marcar(password, 'Escribe tu contraseña.');
    return v.primero;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFormError(form, '');
    const invalido = validar();
    if (invalido) return invalido.focus();

    setBusy(form, true);
    try {
      await api.auth.login({ email: email.value, password: password.value });
      location.assign(safeNext());
    } catch (err) {
      setBusy(form, false);
      if (err.code === 'credenciales') {
        setFormError(form, 'Correo o contraseña incorrectos. Revísalos e inténtalo de nuevo.');
        password.select();
      } else if (err.code === 'sin-verificar') {
        setFormError(form, 'Aún no has verificado tu correo. Abre el enlace que te enviamos para activar tu cuenta.');
      } else {
        setFormError(form, 'No pudimos iniciar sesión. Inténtalo de nuevo en un momento.');
      }
    }
  });
}

function iniciarRegistro(form) {
  const el = form.elements;
  const { first_name, last_name, id_type, id_number, birth_date, email, phone, latitude, longitude, address, address_ref, password, password_confirm, terms } = el;
  const buscador = form.querySelector('[data-mapa-busqueda]');
  birth_date.max = isoHaceAnios(EDAD_MINIMA);
  initMapPicker(form.querySelector('[data-direccion]'));
  const exito = document.querySelector('[data-exito]');

  // La cédula solo admite dígitos: se limpian puntos, guiones y letras al escribir o pegar
  id_number.addEventListener('input', () => { id_number.value = id_number.value.replace(/\D/g, '').slice(0, 9); });

  function validar() {
    const v = validador([first_name, last_name, id_number, birth_date, email, phone, latitude, address, password, password_confirm, terms]);

    const nombre = first_name.value.trim();
    if (!nombre) v.marcar(first_name, 'Escribe tu nombre.');
    else if (nombre.length < 2 || !NOMBRE_RE.test(nombre)) v.marcar(first_name, 'Usa solo letras (mínimo 2).');

    const apellido = last_name.value.trim();
    if (!apellido) v.marcar(last_name, 'Escribe tu apellido.');
    else if (apellido.length < 2 || !NOMBRE_RE.test(apellido)) v.marcar(last_name, 'Usa solo letras (mínimo 2).');

    if (!id_number.value) v.marcar(id_number, 'Escribe tu cédula.');
    else if (!CEDULA_RE.test(id_number.value)) v.marcar(id_number, 'La cédula debe tener entre 6 y 9 números.');

    if (!birth_date.value) v.marcar(birth_date, 'Escribe tu fecha de nacimiento.');
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(birth_date.value) || birth_date.value < '1900-01-01') v.marcar(birth_date, 'Revisa la fecha de nacimiento.');
    else if (edadDe(birth_date.value) < EDAD_MINIMA) v.marcar(birth_date, `Debes tener al menos ${EDAD_MINIMA} años para crear una cuenta.`);

    if (!email.value.trim()) v.marcar(email, 'Escribe tu correo.');
    else if (!EMAIL_RE.test(email.value.trim())) v.marcar(email, 'Revisa el correo: debe verse como nombre@dominio.com.');

    if (!phone.value.trim()) v.marcar(phone, 'Escribe tu teléfono móvil.');
    else if (!MOVIL_RE.test(normalizarTelefono(phone.value))) v.marcar(phone, 'Revisa el teléfono: por ejemplo 0414 1234567.');

    if (!latitude.value || !longitude.value) v.marcar(latitude, 'Marca tu ubicación en el mapa: busca tu dirección o toca el punto exacto.');
    else if (!dentroDeVenezuela(Number(latitude.value), Number(longitude.value))) v.marcar(latitude, 'El punto marcado está fuera de Venezuela. Revísalo.');

    if (!address.value.trim()) v.marcar(address, 'Escribe tu dirección.');
    else if (address.value.trim().length < 10) v.marcar(address, 'Agrega más detalle a la dirección (calle, casa o edificio).');

    if (!password.value) v.marcar(password, 'Crea una contraseña.');
    else if (password.value.length < 8 || !/\p{L}/u.test(password.value) || !/\d/.test(password.value)) {
      v.marcar(password, 'Usa al menos 8 caracteres, con una letra y un número.');
    }

    if (!password_confirm.value) v.marcar(password_confirm, 'Repite la contraseña.');
    else if (password_confirm.value !== password.value) v.marcar(password_confirm, 'Las contraseñas no coinciden.');

    if (!terms.checked) v.marcar(terms, 'Debes aceptar los términos y la política de privacidad.');
    return v.primero;
  }

  function mostrarExito(correo) {
    form.hidden = true;
    document.querySelector('[data-intro]').hidden = true;
    document.querySelector('[data-pie]').hidden = true;
    exito.querySelector('[data-exito-email]').textContent = correo;
    exito.hidden = false;
    exito.focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFormError(form, '');
    const invalido = validar();
    if (invalido) return (invalido === latitude ? buscador : invalido).focus();

    setBusy(form, true);
    try {
      const res = await api.auth.register({
        first_name: first_name.value.trim(),
        last_name: last_name.value.trim(),
        id_type: id_type.value,
        id_number: id_number.value,
        birth_date: birth_date.value,
        email: email.value.trim(),
        phone: normalizarTelefono(phone.value),
        address: address.value.trim(),
        address_ref: address_ref.value.trim(),
        latitude: Number(latitude.value),
        longitude: Number(longitude.value),
        password: password.value,
      });
      // Con backend real y verificación por correo no hay sesión todavía: se muestra «Revisa tu correo»
      if (res?.verificacion) mostrarExito(email.value.trim());
      else location.assign(safeNext());
    } catch (err) {
      setBusy(form, false);
      if (err.code === 'email-existe') {
        setError(email, h('span', {}, 'Ya existe una cuenta con este correo. ',
          h('a', { href: `/cuenta/login.html${location.search}` }, 'Inicia sesión aquí')));
        email.focus();
      } else if (err.code === 'cedula-existe') {
        setError(id_number, 'Ya existe una cuenta con esta cédula.');
        id_number.focus();
      } else {
        setFormError(form, 'No pudimos crear la cuenta. Inténtalo de nuevo en un momento.');
      }
    }
  });
}

const form = document.querySelector('form[data-form]');
if (form) {
  if (form.dataset.form === 'login') iniciarLogin(form);
  else if (form.dataset.form === 'registro') iniciarRegistro(form);
  clearOnInput(form);
  initPasswordToggles();
  carryNext();
  // Si ya hay sesión, no tiene sentido mostrar estas pantallas
  api.auth.me().then((user) => { if (user) location.replace(safeNext()); });
}
