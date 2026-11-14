// Carrito del visitante. Guarda solo {slug, qty} en localStorage: nunca precios (esos salen del catálogo).
// Avisa a la misma pestaña (evento «carrito:cambio») y a las demás (evento «storage»).
const CLAVE = 'jenk.carrito';
export const MAX_POR_PRODUCTO = 20;

const limitar = (n) => Math.min(MAX_POR_PRODUCTO, Math.max(1, Math.floor(Number(n)) || 1));

function leer() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    if (!Array.isArray(datos)) return [];
    return datos
      .filter((l) => l && typeof l.slug === 'string' && l.slug)
      .map((l) => ({ slug: l.slug, qty: limitar(l.qty) }));
  } catch { return []; }
}

function guardar(lineas) {
  try { localStorage.setItem(CLAVE, JSON.stringify(lineas)); } catch { /* modo privado o sin espacio: el carrito dura solo esta visita */ }
  window.dispatchEvent(new CustomEvent('carrito:cambio'));
}

export const carrito = {
  leer,
  contar: () => leer().reduce((s, l) => s + l.qty, 0),
  agregar(slug, qty = 1) {
    const lineas = leer();
    const l = lineas.find((x) => x.slug === slug);
    if (l) l.qty = limitar(l.qty + qty); else lineas.push({ slug, qty: limitar(qty) });
    guardar(lineas);
  },
  cambiar(slug, qty) {
    guardar(leer().map((l) => (l.slug === slug ? { ...l, qty: limitar(qty) } : l)));
  },
  quitar(slug) { guardar(leer().filter((l) => l.slug !== slug)); },
  vaciar() { guardar([]); },
  onChange(cb) {
    const f = () => cb();
    window.addEventListener('carrito:cambio', f);
    window.addEventListener('storage', f);
    return () => { window.removeEventListener('carrito:cambio', f); window.removeEventListener('storage', f); };
  },
};
