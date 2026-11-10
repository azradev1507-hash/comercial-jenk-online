// ÚNICO lugar con fetch. Todas las llamadas al backend (api/*.py en Vercel) pasan por request().
import { ApiError } from './utils/api-error.js';
import { mockApi } from './mock/mock-data.js';

export { ApiError };

// Módulos simulados mientras su backend no exista. auth ya es real (api/auth.py + Supabase).
const MOCK = { auth: false, catalog: true, cart: true };
const BASE = '/api';

function csrfToken() {
  const m = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

async function request(path, { method = 'GET', body, query } = {}) {
  const url = new URL(BASE + path, location.origin);
  Object.entries(query || {}).forEach(([k, v]) => v != null && url.searchParams.set(k, v));

  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['X-CSRF-Token'] = csrfToken();

  let res;
  try {
    res = await fetch(url, { method, headers, credentials: 'same-origin', body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.', 0, 'network');
  }

  let data = null;
  if (res.status !== 204) {
    try { data = await res.json(); } catch { /* respuesta sin JSON */ }
  }
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new CustomEvent('session:expired'));
    throw new ApiError(data?.message || 'Algo salió mal. Inténtalo de nuevo.', res.status, data?.code, data?.details);
  }
  return data;
}

// La tasa cambia poco: se guarda 5 minutos para no repetir la llamada en cada componente.
let rateCache = null;
const RATE_TTL = 5 * 60 * 1000;

const real = {
  auth: {
    login: (data) => request('/auth/login', { method: 'POST', body: data }),
    register: (data) => request('/auth/register', { method: 'POST', body: data }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me').catch((e) => (e.status === 401 ? null : Promise.reject(e))),
  },
  catalog: {
    list: (params) => request('/catalog/products', { query: params }),
    get: (slug) => request(`/catalog/products/${encodeURIComponent(slug)}`),
    rate: () => request('/catalog/rate'),
  },
  cart: {
    get: () => request('/cart'),
    addItem: (item) => request('/cart/items', { method: 'POST', body: item }),
  },
};

const pick = (name) => (MOCK[name] ? mockApi[name] : real[name]);
const impl = { auth: pick('auth'), catalog: pick('catalog'), cart: pick('cart') };

export const api = {
  ...impl,
  catalog: {
    ...impl.catalog,
    async rate() {
      if (rateCache && Date.now() - rateCache.at < RATE_TTL) return rateCache.value;
      const value = await impl.catalog.rate();
      rateCache = { value, at: Date.now() };
      return value;
    },
  },
};
