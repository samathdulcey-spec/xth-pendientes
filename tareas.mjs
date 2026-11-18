// Lógica pura de la lista de pendientes. No toca el DOM ni el almacenamiento,
// así se puede probar con node:test y reutilizar en la interfaz.

export function validarTitulo(titulo) {
  return typeof titulo === 'string' && titulo.trim().length > 0;
}

export function crearTarea(titulo, id, creada = new Date().toISOString()) {
  return {
    id,
    titulo: titulo.trim(),
    hecha: false,
    creada,
  };
}

export function alternarTarea(lista, id) {
  return lista.map((tarea) =>
    tarea.id === id ? { ...tarea, hecha: !tarea.hecha } : tarea,
  );
}

export function eliminarTarea(lista, id) {
  return lista.filter((tarea) => tarea.id !== id);
}

// Agrega las tareas importadas que aún no existen (por id) y descarta
// las que no tengan un título válido. No modifica la lista original.
export function fusionarTareas(actuales, importadas) {
  const ids = new Set(actuales.map((t) => t.id));
  const nuevas = importadas.filter(
    (t) => validarTitulo(t?.titulo) && !ids.has(t.id),
  );
  return [...actuales, ...nuevas.map((t) => crearTarea(t.titulo, t.id, t.creada))];
}

export function filtrarTareas(lista, filtro) {
  if (filtro === 'pendientes') return lista.filter((t) => !t.hecha);
  if (filtro === 'hechas') return lista.filter((t) => t.hecha);
  return lista;
}
