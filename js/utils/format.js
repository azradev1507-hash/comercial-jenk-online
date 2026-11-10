// Moneda (USD/Bs), tasa BCV y fechas.
const numero = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = new Intl.DateTimeFormat('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatUsd = (n) => `$${numero.format(n)}`;
export const formatBs = (n) => `Bs ${numero.format(n)}`;
export const toBs = (usd, rate) => usd * rate;
export const formatRate = (rate) => numero.format(rate);
export const formatDate = (iso) => fecha.format(new Date(iso));
