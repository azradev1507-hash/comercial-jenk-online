class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
    <a class="skip" href="#contenido">Ir al contenido</a>
    <header class="site-header"><div class="wrap">
      <a class="logo" href="/">Comercial Jenk Cáceres</a>
      <nav class="nav" aria-label="Principal">
        <a href="/tienda.html">Tienda</a>
        <a href="/tienda.html?cat=aretes">Aretes</a>
        <a href="/tienda.html?cat=collares">Collares</a>
        <a href="/tienda.html?cat=pulseras">Pulseras</a>
      </nav>
      <a class="cart-link" href="/carrito.html">Carrito <span id="cart-count">0</span></a>
    </div></header>`;
  }
}
customElements.define('site-header', SiteHeader);
