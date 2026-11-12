// ÚNICO lugar con llamadas al backend. Por ahora devuelve datos de ejemplo;
// cuando exista /api/catalog se cambia aquí y ninguna página se entera.
import { authRemoto } from './services/auth-remoto.js';

// Sin backend (servidor estático): localStorage.setItem('jenk.mock','1') en la consola activa la sesión simulada.
// El mock solo se descarga en ese caso; por defecto NO se carga ni se usa.
const USAR_MOCK = (() => { try { return localStorage.getItem('jenk.mock') === '1'; } catch { return false; } })();

function authSimulada() {
  console.warn('[Jenk] Sesión SIMULADA activa (localStorage "jenk.mock"). No se envía nada al backend. Para desactivarla: localStorage.removeItem("jenk.mock")');
  const cargar = () => import('./mock/auth-local.js').then((m) => m.authLocal);
  return {
    register: (d) => cargar().then((a) => a.register(d)),
    login: (d) => cargar().then((a) => a.login(d)),
    recover: (d) => cargar().then((a) => a.recover(d)),
    logout: () => cargar().then((a) => a.logout()),
    me: () => cargar().then((a) => a.me()),
    onChange(cb) { let off = () => {}; cargar().then((a) => { off = a.onChange(cb); }); return () => off(); },
  };
}

// Productos de ejemplo. Campos opcionales: oldPrice (precio anterior, muestra el % de descuento) y badge ('Nuevo', 'Últimas piezas'…).
const MOCK = [
  { slug: 'aretes-perla-gota',     name: 'Aretes perla gota',                  category: 'Aretes',    price: 4.5,  tone: '#f3dce6', bead: '#c0527a', badge: 'Nuevo' },
  { slug: 'collar-cadena-luna',    name: 'Collar cadena luna',                 category: 'Collares',  price: 8,    tone: '#f7eaf0', bead: '#8c3357' },
  { slug: 'pulsera-cuentas-rosa',  name: 'Pulsera cuentas rosa',               category: 'Pulseras',  price: 5.5,  tone: '#fef3e0', bead: '#e8a0b8' },
  { slug: 'anillo-ajustable-flor', name: 'Anillo ajustable flor',              category: 'Anillos',   price: 3.75, tone: '#f2e8ee', bead: '#b5700d' },
  { slug: 'aretes-aro-dorado',     name: 'Aretes aro dorado',                  category: 'Aretes',    price: 4,    tone: '#fef3e0', bead: '#b5700d' },
  { slug: 'conjunto-perlas',       name: 'Conjunto collar y aretes de perlas', category: 'Conjuntos', price: 12,   tone: '#f3dce6', bead: '#a8406a', oldPrice: 15 },
  { slug: 'pulsera-eslabones',     name: 'Pulsera eslabones',                  category: 'Pulseras',  price: 6,    tone: '#f7eaf0', bead: '#c0527a' },
  { slug: 'collar-corazon',        name: 'Collar corazón',                     category: 'Collares',  price: 7.25, tone: '#f2e8ee', bead: '#8c3357', badge: 'Nuevo' },
  { slug: 'aretes-flor-nacar',     name: 'Aretes flor nácar',                  category: 'Aretes',    price: 5,    tone: '#f7eaf0', bead: '#e8a0b8', oldPrice: 6.25 },
  { slug: 'collar-perlas-largo',   name: 'Collar de perlas largo',             category: 'Collares',  price: 9.5,  tone: '#f3dce6', bead: '#a8406a' },
  { slug: 'pulsera-dije-estrella', name: 'Pulsera con dije de estrella',       category: 'Pulseras',  price: 4.75, tone: '#fef3e0', bead: '#b5700d', badge: 'Últimas piezas' },
  { slug: 'anillo-doble-perla',    name: 'Anillo doble con perla',             category: 'Anillos',   price: 4.25, tone: '#f3dce6', bead: '#8c3357' },
  { slug: 'conjunto-corazones',    name: 'Conjunto corazones dorados',         category: 'Conjuntos', price: 10.5, tone: '#fef3e0', bead: '#b5700d', badge: 'Nuevo' },
  { slug: 'aretes-trepadores',     name: 'Aretes trepadores',                  category: 'Aretes',    price: 3.5,  tone: '#f2e8ee', bead: '#c0527a' },
  { slug: 'pulsera-triple-hilo',   name: 'Pulsera triple hilo',                category: 'Pulseras',  price: 6.5,  tone: '#f7eaf0', bead: '#8c3357', oldPrice: 8 },
  { slug: 'anillo-minimal-liso',   name: 'Anillo minimal liso',                category: 'Anillos',   price: 3,    tone: '#f2e8ee', bead: '#e8a0b8' },
  { slug: 'collar-gargantilla',    name: 'Gargantilla cadena fina',            category: 'Collares',  price: 6.75, tone: '#fef3e0', bead: '#b5700d' },
  { slug: 'conjunto-flores-rosa',  name: 'Conjunto flores rosa',               category: 'Conjuntos', price: 11,   tone: '#f3dce6', bead: '#c0527a' },
];

// Banners de la tienda. type: 'coupon' (cupón copiable) | 'promo' (enlace a una categoría o página).
// size: 'lg' | 'md' | 'sm' (ocupan 6, 3 y 3 de 12 columnas). tone (solo promo): 'rose' | 'ink' | 'cream'.
// Para añadir una promoción basta con agregar un objeto aquí.
const PROMOS = [
  { id: 'cupon-bienvenida', type: 'coupon', size: 'lg', title: '10% menos en tu primera compra', text: 'Usa este cupón al pagar.', note: 'Válido en compras desde $10', code: 'JENK10' },
  { id: 'promo-conjuntos',  type: 'promo',  size: 'md', tone: 'rose', title: 'Conjuntos desde $10.50', text: 'Collar y aretes que combinan.', cta: 'Ver conjuntos', href: '/tienda.html?cat=conjuntos' },
  { id: 'promo-pulseras',   type: 'promo',  size: 'sm', tone: 'ink',  title: '2 pulseras por $9', text: 'Hasta el domingo.', cta: 'Ver pulseras', href: '/tienda.html?cat=pulseras' },
];

const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const ORDEN = {
  nuevo: null,
  'precio-asc': (a, b) => a.price - b.price,
  'precio-desc': (b, a) => a.price - b.price,
  nombre: (a, b) => a.name.localeCompare(b.name, 'es'),
};

export const api = {
  catalog: {
    // category: 'aretes' | 'collares'… (sin tildes ni mayúsculas) · q: texto de búsqueda · sort: 'nuevo' | 'precio-asc' | 'precio-desc' | 'nombre'
    list: async ({ limit = 8, category = '', q = '', sort = 'nuevo' } = {}) => {
      let items = MOCK.filter((p) => (!category || norm(p.category) === norm(category))
        && (!q || norm(`${p.name} ${p.category}`).includes(norm(q))));
      if (ORDEN[sort]) items = [...items].sort(ORDEN[sort]);
      return items.slice(0, limit);
    },
    categories: async () => [...new Set(MOCK.map((p) => p.category))],
    get: async (slug) => MOCK.find((p) => p.slug === slug) ?? null,
    // Devuelve un Map slug → producto (los slugs que ya no existen simplemente no aparecen)
    byIds: async (slugs) => new Map(MOCK.filter((p) => slugs.includes(p.slug)).map((p) => [p.slug, p])),
  },
  promos: {
    list: async () => PROMOS,
  },
  // Cupones: el backend es quien decide. Este mock refleja el banner de la tienda (JENK10: 10% desde $10).
  coupons: {
    validate: async (code, subtotalCents) => {
      const c = String(code).trim().toUpperCase();
      if (c === 'JENK10') {
        if (subtotalCents < 1000) return { ok: false, message: 'Este cupón aplica en compras desde $10.' };
        return { ok: true, code: c, descuentoCents: Math.round(subtotalCents * 0.10), message: '10% de descuento aplicado.' };
      }
      return { ok: false, message: 'Ese cupón no existe o ya venció.' };
    },
  },
  // Métodos de entrega. costoUsd: número = costo fijo; null = se confirma al procesar el pedido (pendiente definir tarifas).
  delivery: {
    list: async () => [
      { id: 'RET', name: 'Retiro en tienda', costoUsd: 0 },
      { id: 'ED',  name: 'Entrega a domicilio', costoUsd: null },
      { id: 'EDI', name: 'Entrega inmediata', costoUsd: null },
      { id: 'EPP', name: 'Envío por paquetería', costoUsd: null },
    ],
  },
  // Crear pedido: POST /api/orders (por construir en el backend). Se envían solo slug y cantidad:
  // el servidor debe volver a calcular precios, cupón y envío.
  orders: {
    create: async ({ items, coupon, delivery }) => {
      let r;
      try {
        r = await fetch('/api/orders', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, coupon: coupon || null, delivery }),
        });
      } catch { throw Object.assign(new Error('Sin conexión.'), { code: 'red' }); }
      if (r.status === 401) throw Object.assign(new Error('Sin sesión.'), { code: 'sin-sesion' });
      if (r.status === 404 || r.status === 405) throw Object.assign(new Error('Pedidos aún no disponibles.'), { code: 'no-disponible' });
      let d = null; try { d = await r.json(); } catch { /* sin cuerpo */ }
      if (!r.ok) throw Object.assign(new Error(d?.error?.message ?? 'Error del servidor.'), { code: d?.error?.code ?? 'error-servidor' });
      return d;
    },
  },
  rate: async () => 0, // tasa BCV: pendiente de conectar (0 = no mostrar Bs)
  // Sesión de usuarios: backend real (/api/auth/*, cookie HttpOnly). El mock queda solo para desarrollo sin servidor.
  auth: USAR_MOCK ? authSimulada() : authRemoto,
};
