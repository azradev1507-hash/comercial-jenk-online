// Avisos breves. Uso: toast('Producto agregado', { type: 'exito' })
let zona;

export function toast(message, { type = 'info', ms = 4000 } = {}) {
  if (!zona) {
    zona = document.createElement('div');
    zona.className = 'toast-zona';
    zona.setAttribute('role', 'status');
    zona.setAttribute('aria-live', 'polite');
    document.body.append(zona);
  }
  const item = document.createElement('div');
  item.className = `toast toast--${type}`;
  item.textContent = message;
  zona.append(item);
  setTimeout(() => item.remove(), ms);
}
