// Deduce la categoría y la fecha límite de una tarea a partir de lo que se escribe.
// Sin DOM, para poder probarlo. Las fechas se calculan con UTC para no depender de la zona.

const PALABRAS = [
  ['musica', ['beat', 'cancion', 'canción', 'música', 'musica', 'letra', 'estudio', 'wtom', 'isrc', 'iswc', 'distribucion', 'distribución', 'spotify', 'mezcla', 'master']],
  ['xth-ropa', ['ropa', 'camisa', 'xth', 'diseño', 'prenda', 'tela', 'estampado', 'marca de ropa', 'pantalon', 'pantalón', 'zapato']],
  ['redes', ['instagram', 'tiktok', 'facebook', 'youtube', 'metricool', 'publicar', 'comentario', 'seguidores', 'live', 'redes']],
  ['contenido', ['foto', 'video', 'vídeo', 'grabar', 'editar', 'reel', 'drive', 'contenido']],
  ['universidad', ['universidad', 'tarea de', 'ensayo', 'lectura', 'informe', 'ockham', 'escoto', 'examen', 'clase']],
  ['personal', ['ejercicio', 'orar', 'oración', 'oracion', 'iglesia', 'salud', 'dormir', 'comer', 'correr', 'claude code']],
];

const DIAS = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };

function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function deducirCategoria(titulo) {
  const t = normalizar(titulo);
  for (const [categoria, claves] of PALABRAS) {
    if (claves.some((c) => t.includes(normalizar(c)))) return categoria;
  }
  return 'otros';
}

function sumarDias(fecha, dias) {
  return new Date(fecha.getTime() + dias * 86400000);
}

// Devuelve 'AAAA-MM-DD' si el texto trae una fecha o un día de la semana; si no, null.
export function deducirFecha(titulo, hoy = new Date()) {
  const t = normalizar(titulo);
  const base = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  if (/\bhoy\b/.test(t)) return base.toISOString().slice(0, 10);
  if (/\bpasado manana\b/.test(t)) return sumarDias(base, 2).toISOString().slice(0, 10);
  if (/\bmanana\b/.test(t)) return sumarDias(base, 1).toISOString().slice(0, 10);
  const iso = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];
  const corta = t.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (corta) {
    const fecha = new Date(Date.UTC(base.getUTCFullYear(), Number(corta[2]) - 1, Number(corta[1])));
    return (fecha < base ? new Date(Date.UTC(base.getUTCFullYear() + 1, fecha.getUTCMonth(), fecha.getUTCDate())) : fecha).toISOString().slice(0, 10);
  }
  const nombreDia = Object.keys(DIAS).find((d) => new RegExp('\\b' + d + '\\b').test(t));
  if (nombreDia) {
    const diff = (DIAS[nombreDia] - base.getUTCDay() + 7) % 7;
    return sumarDias(base, diff === 0 ? 7 : diff).toISOString().slice(0, 10);
  }
  return null;
}

// Urgente: vence hoy, ya venció, o vence en los próximos 2 días.
export function esUrgente(tarea, hoy = new Date()) {
  if (!tarea.vence || tarea.hecha) return false;
  const base = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  return (Date.parse(tarea.vence) - base) / 86400000 <= 2;
}
