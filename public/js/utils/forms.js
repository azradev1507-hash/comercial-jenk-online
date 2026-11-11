// Ayudas compartidas por los formularios de cuenta (login y registro)
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Muestra u oculta el error de un campo. El <p> del error debe tener id="<id del campo>-error".
// `msg` puede ser texto o un nodo (por ejemplo, con un enlace). Vacío = limpiar.
export function setError(input, msg) {
  const el = document.getElementById(`${input.id}-error`);
  if (msg) {
    el.replaceChildren(msg);
    el.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  } else {
    el.replaceChildren();
    el.hidden = true;
    input.removeAttribute('aria-invalid');
  }
}

// Error general del formulario (role="alert"); vacío = limpiar
export function setFormError(form, msg) {
  form.querySelector('.form-error').textContent = msg;
}

export function setBusy(form, busy) {
  const btn = form.querySelector('[type="submit"]');
  btn.disabled = busy;
  if (busy) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy');
}

// Al escribir en un campo se quita su error
export function clearOnInput(form) {
  form.addEventListener('input', (e) => {
    if (e.target.matches('input')) setError(e.target, '');
  });
}

// Botón «Mostrar / Ocultar» de las contraseñas
export function initPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
    const input = document.getElementById(btn.dataset.togglePassword);
    btn.addEventListener('click', () => {
      const mostrar = input.type === 'password';
      input.type = mostrar ? 'text' : 'password';
      btn.textContent = mostrar ? 'Ocultar' : 'Mostrar';
      btn.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  });
}

// A dónde volver después de ingresar (?next=/ruta). Solo rutas internas del sitio y nunca las
// propias pantallas de cuenta (evita redirecciones a otros dominios y bucles).
export function safeNext(fallback = '/') {
  const next = new URLSearchParams(location.search).get('next');
  if (!next || !/^\/(?![/\\])/.test(next) || next.startsWith('/cuenta/')) return fallback;
  return next;
}

// Los enlaces «ingresar ↔ crear cuenta» conservan el ?next
export function carryNext() {
  document.querySelectorAll('[data-carry-next]').forEach((a) => { a.search = location.search; });
}
