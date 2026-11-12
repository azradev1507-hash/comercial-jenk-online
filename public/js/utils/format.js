// Moneda: dólares y bolívares (tasa BCV)
export function formatUsd(n) { return `$${Number(n).toFixed(2)}`; }
export function formatBs(n, rate) {
  return `Bs ${(n * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
