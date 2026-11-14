// Hero de la tienda: título, buscador y un brazalete de cuentas dibujado en SVG.
// Al buscar emite el evento «buscar» (detail = texto) para que la página filtre el catálogo.
const NS = 'http://www.w3.org/2000/svg';

function dibujarBrazalete(svg) {
  const N = 16, CX = 200, CY = 190, RX = 150, RY = 120;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const x = CX + RX * Math.cos(a), y = CY + RY * Math.sin(a);
    const grande = i % 4 === 0;
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1));
    c.setAttribute('r', grande ? 24 : 15);
    c.setAttribute('fill', `url(#${grande ? 'tb-rose' : i % 2 ? 'tb-pearl' : 'tb-deep'})`);
    svg.appendChild(c);
  }
  const dije = document.createElementNS(NS, 'path');
  dije.setAttribute('d', 'M200 316 q-22 20 0 52 q22 -32 0 -52z');
  dije.setAttribute('fill', 'url(#tb-rose)');
  svg.appendChild(dije);
}

class SiteHero extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
    <section class="bento tienda-hero" aria-label="Portada de la tienda">
      <div class="tile th-main">
        <h1>Encuentra tu próxima pieza</h1>
        <p>Aretes, collares, pulseras, anillos y conjuntos. Busca por nombre o filtra por tipo.</p>
        <form class="search" role="search">
          <label class="sr-only" for="hero-q">Buscar en la tienda</label>
          <input id="hero-q" name="q" type="search" placeholder="Busca aretes, collares…" autocomplete="off">
          <button class="btn" type="submit">Buscar</button>
        </form>
      </div>
      <div class="tile th-beads">
        <svg class="bracelet" viewBox="0 0 400 380" role="img" aria-label="Brazalete de cuentas rosas y perlas con un dije">
          <defs>
            <radialGradient id="tb-rose" cx=".32" cy=".28" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".2" stop-color="#e8a0b8"/><stop offset=".7" stop-color="#c0527a"/><stop offset="1" stop-color="#8c3357"/></radialGradient>
            <radialGradient id="tb-deep" cx=".32" cy=".28" r=".8"><stop offset="0" stop-color="#f3dce6"/><stop offset=".5" stop-color="#8c3357"/><stop offset="1" stop-color="#4f1a31"/></radialGradient>
            <radialGradient id="tb-pearl" cx=".32" cy=".28" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#f1e3e9"/><stop offset="1" stop-color="#cdb7c2"/></radialGradient>
          </defs>
        </svg>
      </div>
    </section>`;
    dibujarBrazalete(this.querySelector('.bracelet'));
    this.input = this.querySelector('input');
    this.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.dispatchEvent(new CustomEvent('buscar', { bubbles: true, detail: this.input.value.trim() }));
    });
    // Al borrar el texto se quita el filtro sin tener que pulsar «Buscar»
    this.input.addEventListener('input', () => {
      if (!this.input.value) this.dispatchEvent(new CustomEvent('buscar', { bubbles: true, detail: '' }));
    });
  }

  setQuery(q) { if (this.input) this.input.value = q; }
}
customElements.define('site-hero', SiteHero);
