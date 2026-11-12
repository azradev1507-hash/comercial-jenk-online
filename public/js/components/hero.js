class SiteHero extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
    <div class="title t-main">
        <h2>Esto es un HERO</h2>
        <p>presiona aqui para ver los productos</p>
        <a class="btn">
        TODOS NUESTROS PRODUCTOS
        </a>
    </div>`;
  }
}
customElements.define('site-hero', SiteHero);
