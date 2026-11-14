// Cálculo de totales en CENTAVOS (enteros) para no arrastrar errores de decimales.
// Es solo para mostrar: el backend debe recalcular precios, cupón y envío al crear el pedido.
export const aCentavos = (usd) => Math.round(Number(usd) * 100);

export function calcularTotales(lineas, descuentoCents = 0) {
  const subtotal = lineas.reduce((s, { producto, qty }) => s + aCentavos(producto.price) * qty, 0);
  const descuento = Math.min(Math.max(0, descuentoCents), subtotal);
  return { subtotal, descuento, total: subtotal - descuento };
}
