class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
    <footer class="site-footer"><div class="wrap">
      <div><h2>Comercial Jenk Cáceres</h2><p>Bisutería para cada día y cada ocasión. Venta al detal.</p></div>
      <div><h2>Comprar</h2><a href="/tienda.html">Toda la tienda</a><a href="/carrito.html">Mi carrito</a><a href="/cuenta/login.html">Mi cuenta</a></div>
      <div><h2>Ayuda</h2><a href="/legal/devoluciones.html">Cambios y devoluciones</a><a href="/legal/terminos.html">Términos</a><a href="/legal/privacidad.html">Privacidad</a></div>
      <p class="copy">© ${new Date().getFullYear()} Comercial Jenk Cáceres</p>
    </div></footer>`;
  }
}
customElements.define('site-footer', SiteFooter);
