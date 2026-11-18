// Regla de publicación: un mismo video no se sube a otra red hasta pasados
// DIAS_ENTRE_REDES días desde su última publicación, y nunca el mismo día.
// Solo calcula; no publica nada. Cada publicación se aprueba antes de salir.

export const DIAS_ENTRE_REDES = 3;
const MS_DIA = 86400000;

// historial: [{ videoId, red, fecha: 'AAAA-MM-DD' }]
export function puedeSubirse(historial, videoId, red, fecha) {
  const previas = historial.filter((p) => p.videoId === videoId);
  const destino = Date.parse(fecha);
  return previas.every((p) => {
    if (p.red === red) return true;
    const dias = (destino - Date.parse(p.fecha)) / MS_DIA;
    return dias >= DIAS_ENTRE_REDES;
  });
}

export function proximaFechaPermitida(historial, videoId, red, fecha) {
  let candidata = fecha;
  while (!puedeSubirse(historial, videoId, red, candidata)) {
    candidata = new Date(Date.parse(candidata) + MS_DIA).toISOString().slice(0, 10);
  }
  return candidata;
}

// Plan de un video: una red cada DIAS_ENTRE_REDES días, a partir de fechaInicio.
export function planificar(videoId, redes, fechaInicio) {
  const historial = [];
  return redes.map((red) => {
    const fecha = proximaFechaPermitida(historial, videoId, red, fechaInicio);
    historial.push({ videoId, red, fecha });
    return { red, fecha };
  });
}

// Calcula el estado de publicación de un archivo a partir del historial y las
// programaciones guardadas. Si una fecha existente viola los 3 días, la muestra
// como pendiente en la primera fecha permitida, sin alterar el archivo original.
export function planificarArchivo(archivo, redes, fechaInicio) {
  const videoId = archivo.id ?? archivo.nombre;
  const historialGuardado = [
    ...(Array.isArray(archivo.historial) ? archivo.historial : []),
    ...(Array.isArray(archivo.publicaciones) ? archivo.publicaciones.filter((item) => item.estado === 'publicado' || item.publicado === true) : []),
  ];
  const historial = historialGuardado
    .filter((item) => item?.red && item?.fecha && Number.isFinite(Date.parse(item.fecha)))
    .map((item) => ({ videoId, red: item.red, fecha: item.fecha }));
  const programaciones = [
    ...(Array.isArray(archivo.programaciones) ? archivo.programaciones : []),
    ...(Array.isArray(archivo.publicaciones) ? archivo.publicaciones.filter((item) => item.estado === 'programado' || item.programado === true) : []),
  ].filter((item) => item?.red && item?.fecha && Number.isFinite(Date.parse(item.fecha)))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const porRed = new Map();

  for (const programacion of programaciones) {
    if (!redes.includes(programacion.red) || porRed.has(programacion.red)) continue;
    const fechaPermitida = proximaFechaPermitida(historial, videoId, programacion.red, programacion.fecha);
    const coincide = fechaPermitida === programacion.fecha;
    porRed.set(programacion.red, {
      red: programacion.red,
      fecha: coincide ? programacion.fecha : fechaPermitida,
      estado: coincide ? 'programado' : 'pendiente',
    });
    historial.push({ videoId, red: programacion.red, fecha: coincide ? programacion.fecha : fechaPermitida });
  }

  for (const red of redes) {
    if (porRed.has(red)) continue;
    const fecha = proximaFechaPermitida(historial, videoId, red, fechaInicio);
    porRed.set(red, { red, fecha, estado: 'pendiente' });
    historial.push({ videoId, red, fecha });
  }
  return redes.map((red) => porRed.get(red));
}
