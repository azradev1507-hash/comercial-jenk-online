import { api } from '../api.js';
import { h } from '../utils/dom.js';

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
      </nav>
      <div class="account"></div>
      <a class="cart-link" href="/carrito.html">Carrito <span id="cart-count">0</span></a>
    </div></header>`;
    this.pintarCuenta();
    // Si se ingresa o se sale en otra pestaña, esta también se entera
    this.dejarDeEscuchar = api.auth.onChange(() => this.pintarCuenta());
  }

  disconnectedCallback() { this.dejarDeEscuchar?.(); }

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
