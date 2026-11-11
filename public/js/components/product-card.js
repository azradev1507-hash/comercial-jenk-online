import { h } from '../utils/dom.js';
import { formatUsd, formatBs } from '../utils/format.js';

export function renderProductCard(p, rate = 0) {
  const thumb = h('div', { class: 'thumb', style: `--tone:${p.tone};--bead:${p.bead}` }, h('i'));
  const price = h('span', { class: 'price' }, formatUsd(p.price));
  if (rate) price.append(h('small', {}, formatBs(p.price, rate)));
  return h('a', { class: 'product-card', href: `/producto/${p.slug}` }, thumb,
    h('div', { class: 'info' }, h('span', { class: 'cat' }, p.category), h('h3', {}, p.name), price));
}
