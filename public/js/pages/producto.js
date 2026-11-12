// Detalle de producto: /producto.html?slug=aretes-perla-gota
import { api } from '../api.js';
import { h } from '../utils/dom.js';
import { formatUsd, formatBs } from '../utils/format.js';
import { renderProductCard } from '../components/product-card.js';
import { carrito, MAX_POR_PRODUCTO } from '../services/carrito.js';

const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const raiz = document.getElementById('producto');
const slug = new URLSearchParams(location.search).get('slug') || '';

function meta(selector, crear, valor) {
  let m = document.head.querySelector(selector);
  if (!m) { m = crear(); document.head.append(m); }
  m.setAttribute(m.tagName === 'LINK' ? 'href' : 'content', valor);
}
const metaNombre = (n, v) => meta(`meta[name="${n}"]`, () => h('meta', { name: n }), v);
const metaProp = (p, v) => meta(`meta[property="${p}"]`, () => h('meta', { property: p }), v);

function noEncontrado() {
  document.title = 'Pieza no encontrada · Comercial Jenk Cáceres';
  metaNombre('robots', 'noindex, follow');
  raiz.replaceChildren(h('div', { class: 'tile empty' },
    h('h1', {}, 'No encontramos esa pieza'),
    h('p', {}, 'Puede que ya no esté disponible o que el enlace esté incompleto.'),
    h('a', { class: 'btn', href: '/tienda.html' }, 'Ver la tienda')));
}

function datosEstructurados(p) {
  const s = h('script', { type: 'application/ld+json' });
  s.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, category: p.category,
    offers: { '@type': 'Offer', price: p.price.toFixed(2), priceCurrency: 'USD', url: location.href },
  });
  document.head.append(s);
}

async function init() {
  const [p, rate] = await Promise.all([slug ? api.catalog.get(slug) : null, api.rate()]);
  if (!p) return noEncontrado();

  const titulo = `${p.name} · Comercial Jenk Cáceres`;
  const descr = `${p.name}: ${p.category.toLowerCase().replace(/s$/, '')} de bisutería por ${formatUsd(p.price)}. Precio también en bolívares a la tasa BCV del día.`;
  const url = `${location.origin}/producto.html?slug=${encodeURIComponent(p.slug)}`;
  document.title = titulo;
  metaNombre('description', descr);
  meta('link[rel="canonical"]', () => h('link', { rel: 'canonical' }), url);
  metaProp('og:title', titulo); metaProp('og:description', descr); metaProp('og:url', url);
  datosEstructurados(p);

  document.getElementById('migas').replaceChildren(
    h('a', { href: '/' }, 'Inicio'), ' / ', h('a', { href: '/tienda.html' }, 'Tienda'), ' / ',
    h('a', { href: `/tienda.html?cat=${norm(p.category)}` }, p.category), ' / ',
    h('span', { 'aria-current': 'page' }, p.name));

  const etiqueta = p.oldPrice ? `-${Math.round((1 - p.price / p.oldPrice) * 100)}%` : p.badge;
  const precio = h('p', { class: 'pp-precio' }, formatUsd(p.price));
  if (p.oldPrice) precio.append(h('s', {}, formatUsd(p.oldPrice)));
  if (rate) precio.append(h('small', {}, formatBs(p.price, rate)));

  const cant = h('input', { id: 'cant', type: 'number', min: '1', max: String(MAX_POR_PRODUCTO), value: '1', inputmode: 'numeric' });
  const aviso = h('p', { class: 'pp-aviso', role: 'status' });
  const boton = h('button', { type: 'button', class: 'btn' }, 'Agregar al carrito');
  boton.addEventListener('click', () => {
    const n = Math.min(MAX_POR_PRODUCTO, Math.max(1, Math.floor(Number(cant.value)) || 1));
    cant.value = String(n);
    carrito.agregar(p.slug, n);
    aviso.replaceChildren(`Agregaste ${n} ${n === 1 ? 'unidad' : 'unidades'}. `, h('a', { href: '/payment.html' }, 'Ver carrito'));
  });

  raiz.replaceChildren(
    h('div', { class: 'pp-thumb', style: `--tone:${p.tone};--bead:${p.bead}`, role: 'img', 'aria-label': p.name }, h('i'),
      etiqueta && h('span', { class: `badge${p.oldPrice ? ' badge-sale' : ''}` }, etiqueta)),
    h('div', { class: 'pp-info' },
      h('span', { class: 'cat' }, p.category),
      h('h1', {}, p.name),
      precio,
      h('div', { class: 'pp-compra' }, h('div', { class: 'campo' }, h('label', { for: 'cant' }, 'Cantidad'), cant), boton),
      aviso,
      h('ul', { class: 'pp-notas' },
        h('li', {}, 'Venta al detal.'),
        h('li', {}, h('a', { href: '/legal/devoluciones.html' }, 'Cambios y devoluciones')))));

  const rel = (await api.catalog.list({ category: p.category, limit: 8 })).filter((x) => x.slug !== p.slug).slice(0, 4);
  if (rel.length) {
    document.getElementById('rel-grid').replaceChildren(...rel.map((x) => renderProductCard(x, rate)));
    document.getElementById('relacionados').hidden = false;
  }
}
init();
