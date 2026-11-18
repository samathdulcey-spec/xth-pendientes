// Cálculo de avance para las barras de progreso. Sin DOM, para poder probarlo.

export function porcentaje(hechos, total) {
  if (!Number.isFinite(total) || total <= 0) return 0;
  const acotado = Math.min(Math.max(hechos, 0), total);
  return Math.round((acotado / total) * 100);
}

export function textoProgreso(hechos, total) {
  if (total <= 0) return 'Sin elementos todavía';
  return `${Math.min(hechos, total)} de ${total} (${porcentaje(hechos, total)}%)`;
}
