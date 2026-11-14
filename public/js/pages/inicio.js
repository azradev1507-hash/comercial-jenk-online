import { api } from '../api.js';
import { renderProductCard } from '../components/product-card.js';

// Hilo de cuentas: la pieza memorable del hero
function drawStrand(svg) {
  const NS = 'http://www.w3.org/2000/svg', N = 19;
  for (let i = 0; i <= N; i++) {
    const t = i / N, x = 30 + t * 440, y = 50 + 250 * 4 * t * (1 - t);
    const big = i % 4 === 2;
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y);
    c.setAttribute('r', big ? 19 : 12);
    c.setAttribute('fill', `url(#${big ? 'b-rose' : i % 2 ? 'b-pearl' : 'b-deep'})`);
    svg.appendChild(c);
  }
  const pend = document.createElementNS(NS, 'path');
  pend.setAttribute('d', 'M250 312 q-26 24 0 62 q26 -38 0 -62z');
  pend.setAttribute('fill', 'url(#b-rose)');
  svg.appendChild(pend);
}

async function init() {
  drawStrand(document.getElementById('strand'));
  const [items, rate] = await Promise.all([api.catalog.list({ limit: 8 }), api.rate()]);
  const cards = items.slice(0, 5).map(p => renderProductCard(p, rate));
  cards[0]?.classList.add('big'); // el primero ocupa 2x2 en el bento
  document.getElementById('destacados').replaceChildren(...cards);
}
init();
