import { api } from '../api.js';
import { h } from '../utils/dom.js';

// Banners de promociones y cupones. Los datos viven en api.promos.list();
// cada banner es un cupón copiable (type 'coupon') o un enlace a una categoría (type 'promo').
async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); return true; } catch { /* sin permiso o sin https: se prueba el plan B */ }
  const t = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;opacity:0' }, texto);
  document.body.append(t);
  t.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  t.remove();
  return ok;
}

function cupon(p) {
  const btn = h('button', { type: 'button', class: 'copy-btn' }, 'Copiar código');
  const estado = h('span', { class: 'sr-only', 'aria-live': 'polite' });
  let espera;
  btn.addEventListener('click', async () => {
    const ok = await copiar(p.code);
    btn.textContent = ok ? 'Código copiado' : `Anótalo: ${p.code}`;
    btn.classList.toggle('is-done', ok);
    estado.textContent = ok ? `Cupón ${p.code} copiado` : '';
    clearTimeout(espera);
    espera = setTimeout(() => { btn.textContent = 'Copiar código'; btn.classList.remove('is-done'); estado.textContent = ''; }, 2400);
  });
  return h('article', { class: `tile promo ticket size-${p.size || 'lg'}` },
    h('div', { class: 'ticket-main' }, h('h2', {}, p.title), h('p', {}, p.text), p.note && h('p', { class: 'ticket-note' }, p.note)),
    h('div', { class: 'ticket-stub' }, h('code', { 'aria-label': `Código ${p.code}` }, p.code), btn, estado));
}

function promo(p) {
  return h('a', { class: `tile promo tone-${p.tone || 'rose'} size-${p.size || 'md'}`, href: p.href },
    h('div', {}, h('h2', {}, p.title), p.text && h('p', {}, p.text)),
    p.cta && h('span', { class: 'promo-cta' }, p.cta));
}

class PromoBanners extends HTMLElement {
  async connectedCallback() {
    this.setAttribute('aria-label', 'Promociones y cupones');
    const lista = await api.promos.list();
    if (!lista.length) return this.replaceChildren();
    this.replaceChildren(h('div', { class: 'promos' }, ...lista.map((p) => (p.type === 'coupon' ? cupon(p) : promo(p)))));
  }
}
customElements.define('promo-banners', PromoBanners);
