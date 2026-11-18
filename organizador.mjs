// Organizador de metas diarias. Sin DOM ni almacenamiento, para poder probarlo.
// Las horas libres y los premios se definen cada día, así que llegan como datos.

export function repartirMetas(metas, horasLibres) {
  const pendientes = metas.filter((meta) => !meta.hecha);
  return horasLibres
    .slice(0, pendientes.length)
    .map((hora, indice) => ({ hora, meta: pendientes[indice] }));
}

export function marcarMeta(metas, id) {
  return metas.map((meta) => (meta.id === id ? { ...meta, hecha: !meta.hecha } : meta));
}
