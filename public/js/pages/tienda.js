import { api } from '../api.js';
import { h } from '../utils/dom.js';
import { renderProductCard } from '../components/product-card.js';

const POR_PAGINA = 12;
const ORDENES = [['nuevo', 'Novedades'], ['precio-asc', 'Menor precio'], ['precio-desc', 'Mayor precio'], ['nombre', 'Nombre A-Z']];
const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const params = new URLSearchParams(location.search);
const estado = { cat: params.get('cat') || '', q: params.get('q') || '', sort: params.get('orden') || 'nuevo', pagina: 1 };
let categorias = [];
let rate = 0;

const el = {
  chips: document.getElementById('chips'),
  orden: document.getElementById('orden'),
  grid: document.getElementById('productos'),
  cuenta: document.getElementById('cuenta'),
  mas: document.getElementById('mas'),
};

function sincronizarUrl() {
  const p = new URLSearchParams();
  if (estado.cat) p.set('cat', estado.cat);
  if (estado.q) p.set('q', estado.q);
  if (estado.sort !== 'nuevo') p.set('orden', estado.sort);
  history.replaceState(null, '', p.size ? `?${p}` : location.pathname);
}

function pintarChips() {
  const opciones = [['', 'Todo'], ...categorias.map((c) => [norm(c), c])];
  el.chips.replaceChildren(...opciones.map(([valor, texto]) => {
    const b = h('button', { type: 'button', class: 'chip', 'aria-pressed': String(estado.cat === valor) }, texto);
    b.addEventListener('click', () => { estado.cat = valor; estado.pagina = 1; actualizar(); });
    return b;
  }));
}

function limpiar() {
  estado.cat = ''; estado.q = ''; estado.pagina = 1;
  document.querySelector('site-hero')?.setQuery('');
  actualizar();
}

async function actualizar() {
  sincronizarUrl();
  pintarChips();
  el.orden.value = estado.sort;
  const items = await api.catalog.list({ limit: 100, category: estado.cat, q: estado.q, sort: estado.sort });
  const visibles = items.slice(0, estado.pagina * POR_PAGINA);

  el.cuenta.textContent = items.length === 1 ? '1 producto' : `${items.length} productos`;

  if (!items.length) {
    const volver = h('button', { type: 'button', class: 'btn' }, 'Ver todo el catálogo');
    volver.addEventListener('click', limpiar);
    el.grid.replaceChildren(h('div', { class: 'tile empty' },
      h('h3', {}, 'No encontramos piezas con esos filtros'),
      h('p', {}, 'Prueba con otro tipo de pieza o borra la búsqueda.'), volver));
    el.mas.hidden = true;
    return;
  }

  el.grid.replaceChildren(...visibles.map((p) => renderProductCard(p, rate)));
  const faltan = items.length - visibles.length;
  el.mas.hidden = faltan <= 0;
  el.mas.textContent = `Ver más piezas (${faltan})`;
}

async function init() {
  [categorias, rate] = await Promise.all([api.catalog.categories(), api.rate()]);
  el.orden.replaceChildren(...ORDENES.map(([v, t]) => h('option', { value: v }, t)));
  el.orden.addEventListener('change', () => { estado.sort = el.orden.value; estado.pagina = 1; actualizar(); });
  el.mas.addEventListener('click', () => { estado.pagina += 1; actualizar(); });

  await customElements.whenDefined('site-hero');
  const hero = document.querySelector('site-hero');
  hero.setQuery(estado.q);
  hero.addEventListener('buscar', (e) => { estado.q = e.detail; estado.pagina = 1; actualizar(); });

  actualizar();
}
init();
