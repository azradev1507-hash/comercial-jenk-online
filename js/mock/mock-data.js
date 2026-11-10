// MODO MAQUETA de catálogo y carrito (aún sin backend). Valores de PRUEBA.
// Se desactiva por módulo en el objeto MOCK de api.js. La autenticación ya NO se simula.
import { ApiError } from '../utils/api-error.js';
import { readJson, writeJson } from '../utils/storage.js';

const espera = (ms = 350) => new Promise((r) => setTimeout(r, ms));

const RATE = { rate: 104.5, date: '2026-11-09' }; // VALOR DE PRUEBA

const PRODUCTS = [
  { id: 'p1', slug: 'collar-perlas-sinteticas', name: 'Collar de perlas sintéticas', category: 'Collares', priceUsd: 6.5 },
  { id: 'p2', slug: 'aretes-aro-dorado', name: 'Aretes de aro dorado', category: 'Aretes', priceUsd: 3.2 },
  { id: 'p3', slug: 'pulsera-de-dijes', name: 'Pulsera de dijes', category: 'Pulseras', priceUsd: 4.8 },
  { id: 'p4', slug: 'anillo-ajustable-flor', name: 'Anillo ajustable de flor', category: 'Anillos', priceUsd: 2.5 },
  { id: 'p5', slug: 'set-collar-y-aretes', name: 'Set de collar y aretes', category: 'Sets y conjuntos', priceUsd: 9 },
  { id: 'p6', slug: 'gargantilla-cadena-fina', name: 'Gargantilla de cadena fina', category: 'Collares', priceUsd: 5.4 },
  { id: 'p7', slug: 'aretes-largos-de-cristal', name: 'Aretes largos de cristal', category: 'Aretes', priceUsd: 4.1 },
  { id: 'p8', slug: 'pulsera-rigida-acero', name: 'Pulsera rígida de acero', category: 'Pulseras', priceUsd: 7.3 },
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
