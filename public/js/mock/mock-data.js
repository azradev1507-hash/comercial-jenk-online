// MODO MAQUETA de catálogo y carrito (aún sin backend). Valores de PRUEBA.
// Se desactiva por módulo en el objeto MOCK de api.js. La autenticación ya NO se simula.
import { ApiError } from '../utils/api-error.js';
import { readJson, writeJson } from '../utils/storage.js';

const espera = (ms = 350) => new Promise((r) => setTimeout(r, ms));

const RATE = { rate: 104.5, date: '2026-11-09' }; // VALOR DE PRUEBA

const PRODUCTS = [
  { id: 'p1', slug: 'juego-de-ollas', name: 'Juego de ollas antiadherentes', category: 'Cocina', priceUsd: 38 },
  { id: 'p2', slug: 'set-de-destornilladores', name: 'Set de destornilladores', category: 'Herramientas', priceUsd: 14.5 },
  { id: 'p3', slug: 'organizador-apilable', name: 'Organizador apilable', category: 'Hogar', priceUsd: 9.9 },
  { id: 'p4', slug: 'detergente-liquido-3l', name: 'Detergente líquido 3 L', category: 'Limpieza', priceUsd: 7.25 },
  { id: 'p5', slug: 'cuaderno-universitario', name: 'Cuaderno universitario', category: 'Papelería', priceUsd: 2.8 },
  { id: 'p6', slug: 'lampara-led-escritorio', name: 'Lámpara LED de escritorio', category: 'Hogar', priceUsd: 16 },
  { id: 'p7', slug: 'cafetera-de-goteo', name: 'Cafetera de goteo', category: 'Cocina', priceUsd: 27.4 },
  { id: 'p8', slug: 'cinta-metrica-5m', name: 'Cinta métrica 5 m', category: 'Herramientas', priceUsd: 4.6 },
];

export const mockApi = {
  catalog: {
    async list({ featured } = {}) {
      await espera(600);
      return { items: featured ? PRODUCTS.slice(0, 8) : PRODUCTS, rate: RATE };
    },
    async get(slug) {
      await espera();
      const item = PRODUCTS.find((p) => p.slug === slug);
      if (!item) throw new ApiError('Producto no encontrado.', 404, 'not_found');
      return item;
    },
    async rate() { await espera(200); return RATE; },
  },
  cart: {
    async get() { return { count: readJson('mock_cart_count', 0) }; },
    async addItem() {
      await espera(250);
      const count = readJson('mock_cart_count', 0) + 1;
      writeJson('mock_cart_count', count);
      return { count };
    },
  },
};
