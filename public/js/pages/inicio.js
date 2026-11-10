// Home: productos destacados y etiqueta de precio del hero.
import { api } from '../api.js';
import { renderProductCard, renderProductSkeleton } from '../components/product-card.js';
import { toast } from '../components/toast.js';
import { store } from '../utils/store.js';
import { el, qs } from '../utils/dom.js';
import { formatBs, formatRate, formatDate, toBs } from '../utils/format.js';

const lista = qs('#destacados-lista');
const EJEMPLO_USD = 12;

function pintarEtiqueta(rate) {
  qs('[data-etiqueta-bs]').textContent = formatBs(toBs(EJEMPLO_USD, rate.rate));
  qs('[data-etiqueta-tasa]').textContent = `Tasa BCV: Bs ${formatRate(rate.rate)} · ${formatDate(rate.date)}`;
}

async function agregar(product, boton) {
  boton.disabled = true;
  try {
    const { count } = await api.cart.addItem({ product_id: product.id, quantity: 1 });
    store.set('cartCount', count);
    toast(`${product.name} se agregó al carrito.`, { type: 'exito' });
  } catch (err) {
    toast(err.message, { type: 'error' });
  } finally {
    boton.disabled = false;
  }
}

function estado(mensaje, conReintento) {
  const caja = el('li', { class: 'estado-lista' }, el('p', { text: mensaje }));
  if (conReintento) {
    const b = el('button', { class: 'btn btn--secundario btn--sm', type: 'button', text: 'Reintentar' });
    b.addEventListener('click', cargarDestacados);
    caja.append(b);
  }
  lista.replaceChildren(caja);
}

async function cargarDestacados() {
  lista.setAttribute('aria-busy', 'true');
  lista.replaceChildren(...Array.from({ length: 4 }, renderProductSkeleton));
  try {
    const { items, rate } = await api.catalog.list({ featured: 1 });
    if (!items.length) return estado('Todavía no hay productos destacados. Mira toda la tienda.', false);
    lista.replaceChildren(...items.map((p) => renderProductCard(p, { rate: rate?.rate, onAdd: agregar })));
  } catch (err) {
    estado('No pudimos cargar los productos. Revisa tu conexión e inténtalo de nuevo.', true);
  } finally {
    lista.removeAttribute('aria-busy');
  }
}

store.subscribe('rate', pintarEtiqueta);
if (store.get('rate')) pintarEtiqueta(store.get('rate'));
cargarDestacados();
