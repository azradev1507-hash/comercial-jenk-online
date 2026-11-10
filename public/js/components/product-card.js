// Tarjeta de producto. Exporta una función (se usa en listas), no una etiqueta.
import { el } from '../utils/dom.js';
import { formatUsd, formatBs, toBs } from '../utils/format.js';

export function renderProductCard(product, { rate, onAdd } = {}) {
  const href = `/producto/${encodeURIComponent(product.slug)}`;

  const imagen = product.image
    ? el('img', { src: product.image, alt: product.name, width: 400, height: 300, loading: 'lazy', decoding: 'async' })
    : el('span', { 'aria-hidden': 'true', text: product.name.charAt(0) });

  const boton = el('button', { class: 'btn btn--secundario btn--bloque btn--sm', type: 'button', text: 'Agregar al carrito' });
  boton.addEventListener('click', () => onAdd?.(product, boton));

  return el('li', {},
    el('article', { class: 'producto' },
      el('a', { class: 'producto__enlace', href },
        el('div', { class: 'producto__img' }, imagen),
        el('div', { class: 'producto__cuerpo' },
          el('span', { class: 'producto__categoria', text: product.category }),
          el('h3', { class: 'producto__nombre', text: product.name }),
          el('p', { class: 'producto__precios num' },
            el('span', { class: 'producto__usd', text: formatUsd(product.priceUsd) }),
            rate ? el('span', { class: 'producto__bs', text: formatBs(toBs(product.priceUsd, rate)) }) : null,
          ),
        ),
      ),
      el('div', { class: 'producto__accion' }, boton),
    ),
  );
}

// Esqueleto mientras carga la lista.
export function renderProductSkeleton() {
  return el('li', { 'aria-hidden': 'true' },
    el('article', { class: 'producto producto--cargando' },
      el('div', { class: 'producto__img' }),
      el('div', { class: 'producto__cuerpo' },
        el('span', { class: 'linea linea--corta' }),
        el('span', { class: 'linea' }),
        el('span', { class: 'linea linea--corta' }),
      ),
    ),
  );
}
