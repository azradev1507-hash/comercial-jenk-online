// <site-footer>: enlaces de compra, cuenta y legales.
const TEMPLATE = (year) => `
<footer class="site-footer">
  <div class="contenedor site-footer__grid">
    <div class="site-footer__marca">
      <a class="site-footer__logo" href="/" aria-label="Comercial Jenk Cáceres, ir al inicio"><img src="/assets/img/logo-marca.svg" alt="" width="65" height="36" loading="lazy"></a>
      <p class="site-footer__lema">Bisutería en línea con precios en dólares y bolívares y factura digital.</p>
    </div>
    <nav aria-label="Comprar">
      <h2>Comprar</h2>
      <ul>
        <li><a href="/tienda.html">Tienda</a></li>
        <li><a href="/#categorias">Categorías</a></li>
        <li><a href="/#como-comprar">Cómo comprar</a></li>
        <li><a href="/#preguntas">Preguntas frecuentes</a></li>
      </ul>
    </nav>
    <nav aria-label="Mi cuenta">
      <h2>Mi cuenta</h2>
      <ul>
        <li><a href="/cuenta/login.html">Iniciar sesión</a></li>
        <li><a href="/cuenta/registro.html">Crear cuenta</a></li>
        <li><a href="/carrito.html">Carrito</a></li>
      </ul>
    </nav>
    <nav aria-label="Legal">
      <h2>Legal</h2>
      <ul>
        <li><a href="/legal/terminos.html">Términos y condiciones</a></li>
        <li><a href="/legal/privacidad.html">Política de privacidad</a></li>
        <li><a href="/legal/devoluciones.html">Devoluciones</a></li>
      </ul>
    </nav>
  </div>
  <div class="site-footer__base"><div class="contenedor"><p>© ${year} Comercial Jenk Cáceres. Todos los derechos reservados.</p></div></div>
</footer>`;

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = TEMPLATE(new Date().getFullYear());
  }
}

customElements.define('site-footer', SiteFooter);
