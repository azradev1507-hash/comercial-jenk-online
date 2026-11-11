import { api } from '../api.js';
import { EMAIL_RE, setError, setFormError, setBusy, clearOnInput, initPasswordToggles, safeNext, carryNext } from '../utils/forms.js';

const form = document.getElementById('form-login');
const { email, password } = form.elements;

function validar() {
  let primero = null;
  const marcar = (campo, msg) => { setError(campo, msg); primero ??= campo; };
  setError(email, ''); setError(password, '');
  if (!email.value.trim()) marcar(email, 'Escribe tu correo.');
  else if (!EMAIL_RE.test(email.value.trim())) marcar(email, 'Revisa el correo: debe verse como nombre@dominio.com.');
  if (!password.value) marcar(password, 'Escribe tu contraseña.');
  return primero;
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
      password.focus(); password.select();
    } else {
      setFormError(form, 'No pudimos ingresar. Inténtalo de nuevo en un momento.');
    }
  }
});

clearOnInput(form);
initPasswordToggles();
carryNext();
// Si ya hay sesión, no tiene sentido mostrar el login
api.auth.me().then((user) => { if (user) location.replace(safeNext()); });
