// Carpetas de tareas. Cada una tiene su mob de Minecraft (ver mobs.js).
export const CATEGORIAS = [
  { id: 'musica', nombre: 'Música', mob: 'creeper' },
  { id: 'xth-ropa', nombre: 'XTH marca de ropa', mob: 'esqueleto' },
  { id: 'redes', nombre: 'Redes sociales', mob: 'enderman' },
  { id: 'contenido', nombre: 'Contenido', mob: 'zombi' },
  { id: 'personal', nombre: 'Personal', mob: 'aldeano' },
  { id: 'universidad', nombre: 'Universidad', mob: 'slime' },
  { id: 'otros', nombre: 'Otros', mob: 'slime' },
];

export const CATEGORIA_POR_DEFECTO = 'otros';

export function nombreCategoria(id) {
  return CATEGORIAS.find((c) => c.id === id)?.nombre ?? 'Otros';
}

// Agrupa tareas por categoría, en el orden de CATEGORIAS. Sin tareas, la carpeta sale vacía.
export function agruparPorCategoria(lista) {
  return CATEGORIAS.map((categoria) => ({
    ...categoria,
    tareas: lista.filter((t) => (t.categoria ?? CATEGORIA_POR_DEFECTO) === categoria.id),
  }));
}
