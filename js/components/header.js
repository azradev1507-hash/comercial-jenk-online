// <site-header>: barra superior (tasa BCV), buscador, cuenta, carrito y navegación.
import { api } from '../api.js';
import { store } from '../utils/store.js';
import { formatRate } from '../utils/format.js';

const ICONO_BUSCAR = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
const ICONO_USUARIO = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>';
const ICONO_CARRITO = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2.5l2.2 11h10.1l2-8H6.4"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg>';

const NAV = [
  ['/tienda.html', 'Tienda'],
  ['/#categorias', 'Categorías'],
  ['/#destacados', 'Destacados'],
  ['/#como-comprar', 'Cómo comprar'],
  ['/#preguntas', 'Preguntas frecuentes'],
];

const TEMPLATE = `
<div class="topbar">
  <div class="contenedor topbar__in">
    <p>Precios en dólares y en bolívares</p>
    <p>Tasa BCV: <strong class="num" data-rate>—</strong></p>
  </div>
</div>
<header class="site-header">
  <div class="contenedor site-header__fila">
    <a class="site-header__logo" href="/" aria-label="Comercial Jenk Cáceres, ir al inicio">
      <img src="/assets/img/logo-marca.svg" alt="" width="72" height="40">
    </a>
    <form class="buscador" role="search" action="/tienda.html" method="get">
      <label class="sr-only" for="buscar">Buscar productos</label>
      <input id="buscar" name="q" type="search" placeholder="Busca un producto" autocomplete="off" enterkeyhint="search">
      <button type="submit" aria-label="Buscar">${ICONO_BUSCAR}</button>
    </form>
    <div class="site-header__acciones">
      <a class="accion" href="/cuenta/login.html" data-account>${ICONO_USUARIO}<span data-account-label>Ingresar</span></a>
      <a class="accion" href="/carrito.html" data-cart aria-label="Carrito">${ICONO_CARRITO}<span class="badge num" data-cart-count hidden>0</span></a>
    </div>
  </div>
  <nav class="site-header__nav" aria-label="Principal">
    <div class="contenedor"><ul>${NAV.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul></div>
  </nav>
</header>`;

class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = TEMPLATE; // plantilla fija: no contiene datos de la API
    this.marcarPaginaActual();
    this.unsubscribe = [
      store.subscribe('cartCount', (n) => this.pintarCarrito(n)),
      store.subscribe('rate', (r) => this.pintarTasa(r)),
    ];
    this.cargar();
  }

  disconnectedCallback() {
    this.unsubscribe?.forEach((off) => off());
  }

  marcarPaginaActual() {
    this.querySelectorAll('.site-header__nav a').forEach((a) => {
      if (a.pathname === location.pathname && !a.hash) a.setAttribute('aria-current', 'page');
    });
  }

  async cargar() {
    const [user, cart, rate] = await Promise.allSettled([api.auth.me(), api.cart.get(), api.catalog.rate()]);
    if (user.status === 'fulfilled' && user.value) this.pintarUsuario(user.value);
    if (cart.status === 'fulfilled') store.set('cartCount', cart.value.count);
    if (rate.status === 'fulfilled') store.set('rate', rate.value);
  }

  pintarUsuario(user) {
    store.set('user', user);
    const enlace = this.querySelector('[data-account]');
    enlace.href = '/cuenta/perfil.html';
    this.querySelector('[data-account-label]').textContent = user.first_name;
  }

  pintarCarrito(n) {
    const badge = this.querySelector('[data-cart-count]');
    badge.textContent = n;
    badge.hidden = !n;
    this.querySelector('[data-cart]').setAttribute('aria-label', n ? `Carrito, ${n} ${n === 1 ? 'producto' : 'productos'}` : 'Carrito');
  }

  pintarTasa(r) {
    this.querySelector('[data-rate]').textContent = `Bs ${formatRate(r.rate)}`;
  }
}

customElements.define('site-header', SiteHeader);
