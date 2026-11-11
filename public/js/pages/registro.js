import { api } from '../api.js';
import { h } from '../utils/dom.js';
import { EMAIL_RE, setError, setFormError, setBusy, clearOnInput, initPasswordToggles, safeNext, carryNext } from '../utils/forms.js';

const form = document.getElementById('form-registro');
const { nombre, email, password, password2 } = form.elements;

function validar() {
  let primero = null;
  const marcar = (campo, msg) => { setError(campo, msg); primero ??= campo; };
  [nombre, email, password, password2].forEach((c) => setError(c, ''));
  if (!nombre.value.trim()) marcar(nombre, 'Escribe tu nombre.');
  else if (nombre.value.trim().length < 2) marcar(nombre, 'Escribe al menos 2 letras.');
  if (!email.value.trim()) marcar(email, 'Escribe tu correo.');
  else if (!EMAIL_RE.test(email.value.trim())) marcar(email, 'Revisa el correo: debe verse como nombre@dominio.com.');
  if (!password.value) marcar(password, 'Crea una contraseña.');
  else if (password.value.length < 8) marcar(password, 'Usa al menos 8 caracteres.');
  if (!password2.value) marcar(password2, 'Repite la contraseña.');
  else if (password2.value !== password.value) marcar(password2, 'Las contraseñas no coinciden.');
  return primero;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setFormError(form, '');
  const invalido = validar();
  if (invalido) return invalido.focus();

  setBusy(form, true);
  try {
    await api.auth.register({ nombre: nombre.value, email: email.value, password: password.value });
    location.assign(safeNext());
  } catch (err) {
    setBusy(form, false);
    if (err.code === 'email-existe') {
      setError(email, h('span', {}, 'Ya existe una cuenta con este correo. ',
        h('a', { href: `/cuenta/login.html${location.search}` }, 'Ingresa aquí')));
      email.focus();
    } else {
      setFormError(form, 'No pudimos crear la cuenta. Inténtalo de nuevo en un momento.');
    }
  }
});

clearOnInput(form);
initPasswordToggles();
carryNext();
api.auth.me().then((user) => { if (user) location.replace(safeNext()); });
