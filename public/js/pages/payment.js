// Carrito y resumen del pedido. Los precios salen del catálogo (api), nunca del navegador.
import { api } from '../api.js';
import { h } from '../utils/dom.js';
import { formatUsd, formatBs } from '../utils/format.js';
import { calcularTotales } from '../utils/totales.js';
import { setError, setFormError, setBusy } from '../utils/forms.js';
import { carrito, MAX_POR_PRODUCTO } from '../services/carrito.js';

const $ = (id) => document.getElementById(id);
const el = {
  items: $('items'), vacio: $('vacio'), resumen: $('resumen'), form: $('form-pago'), exito: $('exito'),
  cupon: $('cuponPay'), aplicar: $('aplicar'), entrega: $('deliveryMethod'),
  subtotal: $('t-subtotal'), descuento: $('t-descuento'), filaDescuento: $('fila-descuento'),
  envio: $('t-envio'), total: $('t-total'), totalBs: $('t-total-bs'),
};
const usd = (cents) => formatUsd(cents / 100);

let rate = 0;
let metodos = [];
let lineas = [];                 // [{ producto, qty }]
let cupon = null;                // { code, descuentoCents }

function ayudaCupon(texto, error = false) {
  const p = $('cuponPay-ayuda');
  p.textContent = texto;
  p.style.color = error ? 'var(--danger-hover)' : '';
}

function pintarTotales() {
  const { subtotal, descuento, total } = calcularTotales(lineas, cupon?.descuentoCents ?? 0);
  const m = metodos.find((x) => x.id === el.entrega.value);
  el.subtotal.textContent = usd(subtotal);
  el.filaDescuento.hidden = !descuento;
  el.descuento.textContent = `-${usd(descuento)}`;
  el.envio.textContent = !m ? 'Elige un método' : m.costoUsd === 0 ? 'Gratis' : m.costoUsd == null ? 'Se confirma al procesar' : formatUsd(m.costoUsd);
  el.total.textContent = usd(total);
  el.totalBs.textContent = rate ? formatBs(total / 100, rate) : '';
}

function fila({ producto: p, qty }) {
  const menos = h('button', { type: 'button', class: 'qty-btn', 'aria-label': `Quitar una unidad de ${p.name}` }, '−');
  const mas = h('button', { type: 'button', class: 'qty-btn', 'aria-label': `Agregar una unidad de ${p.name}` }, '+');
  const quitar = h('button', { type: 'button', class: 'item-quitar' }, 'Quitar');
  quitar.setAttribute('aria-label', `Quitar ${p.name} del carrito`);
  menos.disabled = qty <= 1;
  mas.disabled = qty >= MAX_POR_PRODUCTO;
  menos.addEventListener('click', () => carrito.cambiar(p.slug, qty - 1));
  mas.addEventListener('click', () => carrito.cambiar(p.slug, qty + 1));
  quitar.addEventListener('click', () => carrito.quitar(p.slug));
  const precio = h('span', { class: 'item-precio' }, formatUsd(p.price * qty));
  if (rate) precio.append(h('small', {}, formatBs(p.price * qty, rate)));
  return h('li', { class: 'item' },
    h('a', { class: 'item-thumb', href: `/producto.html?slug=${encodeURIComponent(p.slug)}`, 'aria-hidden': 'true', tabindex: '-1', style: `--tone:${p.tone};--bead:${p.bead}` }, h('i')),
    h('div', { class: 'item-info' },
      h('span', { class: 'cat' }, p.category),
      h('a', { class: 'item-nombre', href: `/producto.html?slug=${encodeURIComponent(p.slug)}` }, p.name),
      h('span', { class: 'item-unit' }, `${formatUsd(p.price)} c/u`)),
    h('div', { class: 'qty', role: 'group', 'aria-label': `Cantidad de ${p.name}` }, menos, h('output', { 'aria-live': 'polite' }, String(qty)), mas),
    h('div', { class: 'item-fin' }, precio, quitar));
}

async function cargar() {
  const guardadas = carrito.leer();
  const productos = await api.catalog.byIds(guardadas.map((l) => l.slug));
  // Si un producto ya no existe en el catálogo se saca del carrito
  guardadas.filter((l) => !productos.has(l.slug)).forEach((l) => carrito.quitar(l.slug));
  lineas = guardadas.filter((l) => productos.has(l.slug)).map((l) => ({ producto: productos.get(l.slug), qty: l.qty }));

  const hay = lineas.length > 0;
  el.vacio.hidden = hay;
  el.resumen.hidden = !hay;
  el.items.hidden = !hay;
  el.items.replaceChildren(...lineas.map(fila));

  // El cupón se vuelve a validar si cambia el carrito (por ejemplo, si baja del mínimo)
  if (cupon) {
    const { subtotal } = calcularTotales(lineas);
    const r = await api.coupons.validate(cupon.code, subtotal);
    if (r.ok) cupon = { code: r.code, descuentoCents: r.descuentoCents };
    else { cupon = null; ayudaCupon(r.message, true); }
  }
  pintarTotales();
}

el.aplicar.addEventListener('click', async () => {
  const code = el.cupon.value.trim();
  if (!code) return ayudaCupon('Escribe el código de tu cupón.', true);
  const { subtotal } = calcularTotales(lineas);
  const r = await api.coupons.validate(code, subtotal);
  if (r.ok) { cupon = { code: r.code, descuentoCents: r.descuentoCents }; el.cupon.value = r.code; ayudaCupon(r.message); }
  else { cupon = null; ayudaCupon(r.message, true); }
  pintarTotales();
});
el.cupon.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el.aplicar.click(); } });
el.entrega.addEventListener('change', () => { setError(el.entrega, ''); pintarTotales(); });

el.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setFormError(el.form, '');
  if (!lineas.length) return;
  if (!el.entrega.value) { setError(el.entrega, 'Elige cómo quieres recibir tu pedido.'); return el.entrega.focus(); }

  const user = await api.auth.me();
  if (!user) return location.assign(`/cuenta/login.html?next=${encodeURIComponent('/payment.html')}`);

  setBusy(el.form, true);
  try {
    await api.orders.create({
      items: lineas.map((l) => ({ slug: l.producto.slug, qty: l.qty })),
      coupon: cupon?.code, delivery: el.entrega.value,
    });
    carrito.vaciar();
    $('contenido-carrito').hidden = true;
    el.exito.hidden = false;
    el.exito.focus();
  } catch (err) {
    setBusy(el.form, false);
    const msg = {
      'sin-sesion': 'Tu sesión venció. Vuelve a ingresar para finalizar el pedido.',
      'no-disponible': 'Los pedidos en línea todavía no están habilitados. Tu carrito queda guardado.',
      red: 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.',
    }[err.code] ?? err.message ?? 'No pudimos crear el pedido. Inténtalo de nuevo en un momento.';
    setFormError(el.form, msg);
  }
});

async function init() {
  [rate, metodos] = await Promise.all([api.rate(), api.delivery.list()]);
  el.entrega.replaceChildren(h('option', { value: '' }, 'Elige un método'), ...metodos.map((m) => h('option', { value: m.id }, m.name)));
  carrito.onChange(cargar);
  cargar();
}
init();
