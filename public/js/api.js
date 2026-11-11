// ÚNICO lugar con llamadas al backend. Por ahora devuelve datos de ejemplo;
// cuando exista /api/catalog se cambia aquí y ninguna página se entera.
const MOCK = [
  { slug: 'aretes-perla-gota',   name: 'Aretes perla gota',      category: 'Aretes',    price: 4.5,  tone: '#f3dce6', bead: '#c0527a' },
  { slug: 'collar-cadena-luna',  name: 'Collar cadena luna',     category: 'Collares',  price: 8,    tone: '#f7eaf0', bead: '#8c3357' },
  { slug: 'pulsera-cuentas-rosa', name: 'Pulsera cuentas rosa',  category: 'Pulseras',  price: 5.5,  tone: '#fef3e0', bead: '#e8a0b8' },
  { slug: 'anillo-ajustable-flor', name: 'Anillo ajustable flor', category: 'Anillos',  price: 3.75, tone: '#f2e8ee', bead: '#b5700d' },
  { slug: 'aretes-aro-dorado',   name: 'Aretes aro dorado',      category: 'Aretes',    price: 4,    tone: '#fef3e0', bead: '#b5700d' },
  { slug: 'conjunto-perlas',     name: 'Conjunto collar y aretes de perlas', category: 'Conjuntos', price: 12, tone: '#f3dce6', bead: '#a8406a' },
  { slug: 'pulsera-eslabones',   name: 'Pulsera eslabones',      category: 'Pulseras',  price: 6,    tone: '#f7eaf0', bead: '#c0527a' },
  { slug: 'collar-corazon',      name: 'Collar corazón',         category: 'Collares',  price: 7.25, tone: '#f2e8ee', bead: '#8c3357' },
];
export const api = {
  catalog: {
    list: async ({ limit = 8 } = {}) => MOCK.slice(0, limit),
  },
  rate: async () => 0, // tasa BCV: pendiente de conectar (0 = no mostrar Bs)
};
