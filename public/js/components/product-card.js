import { h } from '../utils/dom.js';
import { formatUsd, formatBs } from '../utils/format.js';

// Tarjeta de producto. Campos opcionales del producto: oldPrice (muestra el % de descuento) y badge.
export function renderProductCard(p, rate = 0) {
  const etiqueta = p.oldPrice ? `-${Math.round((1 - p.price / p.oldPrice) * 100)}%` : p.badge;
  const thumb = h('div', { class: 'thumb', style: `--tone:${p.tone};--bead:${p.bead}` }, h('i'),
    etiqueta && h('span', { class: `badge${p.oldPrice ? ' badge-sale' : ''}` }, etiqueta));
  const price = h('span', { class: 'price' }, formatUsd(p.price));
  if (p.oldPrice) price.append(h('s', {}, formatUsd(p.oldPrice)));
  if (rate) price.append(h('small', {}, formatBs(p.price, rate)));
  return h('a', { class: 'product-card', href: `/producto.html?slug=${encodeURIComponent(p.slug)}` }, thumb,
    h('div', { class: 'info' }, h('span', { class: 'cat' }, p.category), h('h3', {}, p.name), price));
}
