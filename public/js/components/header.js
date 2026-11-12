import { api } from '../api.js';
import { h } from '../utils/dom.js';
import { carrito } from '../services/carrito.js';

// Sin conexión, las páginas muestran /offline.html (el service worker solo hace eso; no guarda nada más)
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
    <a class="skip" href="#contenido">Ir al contenido</a>
    <header class="site-header"><div class="wrap">
      <a class="logo" href="/">Comercial Jenk Cáceres<small>Bisutería</small></a>
      <nav class="nav" aria-label="Principal">
        <a href="/tienda.html">Tienda</a>
        <a href="/tienda.html?cat=aretes">Aretes</a>
        <a href="/tienda.html?cat=collares">Collares</a>
        <a href="/tienda.html?cat=pulseras">Pulseras</a>
        <a href="/tienda.html?cat=anillos">Anillos</a>
        <a href="/tienda.html?cat=conjuntos">Conjuntos</a>
      </nav>
      <div class="account"></div>
      <a class="cart-link" href="/payment.html" aria-label="Ver carrito">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <span id="cart-count" aria-live="polite">0</span></a>
    </div></header>`;
    this.pintarCuenta();
    this.pintarCarrito();
    this.dejarDeEscucharCarrito = carrito.onChange(() => this.pintarCarrito());
    // Si se ingresa o se sale en otra pestaña, esta también se entera
    this.dejarDeEscuchar = api.auth.onChange(() => this.pintarCuenta());
  }

  disconnectedCallback() { this.dejarDeEscuchar?.(); this.dejarDeEscucharCarrito?.(); }

  pintarCarrito() {
    const n = carrito.contar();
    this.querySelector('#cart-count').textContent = String(n);
    this.querySelector('.cart-link').setAttribute('aria-label', n ? `Ver carrito, ${n} ${n === 1 ? 'pieza' : 'piezas'}` : 'Ver carrito');
  }

  async pintarCuenta() {
    const caja = this.querySelector('.account');
    const user = await api.auth.me();
    if (!user) {
      // Desde una página de la tienda, al ingresar se vuelve a la misma página
      const next = location.pathname.startsWith('/cuenta/') ? ''
        : `?next=${encodeURIComponent(location.pathname + location.search)}`;
      caja.replaceChildren(h('a', { class: 'account-link', href: `/cuenta/login.html${next}` }, 'Ingresar'));
      return;
    }
    const salir = h('button', { type: 'button', class: 'account-out' }, 'Salir');
    salir.addEventListener('click', async () => { await api.auth.logout(); this.pintarCuenta(); });
    caja.replaceChildren(h('span', { class: 'account-hello' }, `Hola, ${user.nombre.split(' ')[0]}`), salir);
  }
}
customElements.define('site-header', SiteHeader);

