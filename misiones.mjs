// Misiones del juego, agrupadas por sección. Cada sección tiene sus misiones
// diarias y semanales, y su propio valor por completar.
// Los valores marcados como "propuesta" los puso Claude y se pueden cambiar aquí.

import { PUNTOS } from './reglas.mjs';

export const SECCIONES = [
  {
    id: 'musica',
    nombre: 'Música',
    diarias: [
      { id: 'beat', nombre: 'Hacer un beat', puntos: PUNTOS.metaNormal },
      { id: 'cancion', nombre: 'Hacer una canción', puntos: PUNTOS.metaNormal },
    ],
    semanales: [{ id: 'musica-distribucion', nombre: 'Avance de distribución', puntos: 333 }],
  },
  {
    id: 'contenido',
    nombre: 'Contenido',
    diarias: [
      { id: 'foto', nombre: '1 foto', puntos: PUNTOS.metaNormal },
      { id: 'videos', nombre: '3 a 5 videos', puntos: PUNTOS.metaNormal },
      { id: 'grabar', nombre: 'Grabar, fotos y editar', puntos: PUNTOS.metaNormal },
      { id: 'comentarios', nombre: 'Contestar comentarios', puntos: PUNTOS.metaNormal },
    ],
    semanales: [{ id: 'publicar', nombre: 'Publicar un contenido aprobado', puntos: 77 }],
  },
  {
    id: 'marca-ropa',
    nombre: 'Marca y ropa',
    diarias: [{ id: 'trabajar-ropa', nombre: 'Trabajar en marca de ropa', puntos: PUNTOS.metaNormal }],
    semanales: [
      { id: 'ropa', nombre: 'Avanzar en la ropa', puntos: 111 },
      { id: 'marca-personal', nombre: 'Tarea de marca personal', puntos: 111 },
    ],
  },
  {
    id: 'personal',
    nombre: 'Personal',
    diarias: [
      { id: 'ejercicio', nombre: 'Hacer ejercicio', puntos: PUNTOS.metaNormal },
      { id: 'universidad', nombre: 'Trabajo de la universidad', puntos: PUNTOS.metaNormal },
      { id: 'claude-code', nombre: 'Claude Code', puntos: PUNTOS.metaNormal },
      { id: 'oracion', nombre: 'Orar', puntos: PUNTOS.oracion },
    ],
    semanales: [{ id: 'iglesia', nombre: 'Ir a la iglesia', puntos: PUNTOS.iglesia }],
  },
];

export const OBJETIVOS = SECCIONES.flatMap((seccion) => [
  ...seccion.diarias.map((objetivo) => ({ ...objetivo, categoria: categoriaDe(seccion.id, objetivo.id), periodo: 'dia' })),
  ...seccion.semanales.map((objetivo) => ({ ...objetivo, categoria: categoriaDe(seccion.id, objetivo.id), periodo: 'semana' })),
]);

function categoriaDe(id, objetivoId) {
  if (objetivoId === 'universidad') return 'universidad';
  return ({ musica: 'musica', contenido: 'contenido', 'marca-ropa': 'xth-ropa', personal: 'personal' })[id] ?? 'otros';
}

export const MISIONES_DIARIAS = OBJETIVOS.filter((objetivo) => objetivo.periodo === 'dia');
export const MISIONES_SEMANALES = OBJETIVOS.filter((objetivo) => objetivo.periodo === 'semana');

export function buscarMision(id) {
  return [...MISIONES_DIARIAS, ...MISIONES_SEMANALES].find((mision) => mision.id === id) ?? null;
}

// Puntos que da completar una misión. A tiempo suma el bonus de entrega.
export function puntosAlCompletar(mision, { aTiempo = true } = {}) {
  if (!mision) return 0;
  if (mision.id === 'oracion' || mision.id === 'iglesia') return mision.puntos;
  return aTiempo ? mision.puntos + PUNTOS.bonusATiempo : mision.puntos;
}

// Periodo al que pertenece una fecha: día (AAAA-MM-DD) y semana ISO (AAAA-Www).
export function periodoDe(fecha) {
  const dia = fecha.toISOString().slice(0, 10);
  const inicio = new Date(Date.UTC(fecha.getUTCFullYear(), 0, 1));
  const dias = Math.floor((fecha - inicio) / 86400000);
  const semana = Math.ceil((dias + inicio.getUTCDay() + 1) / 7);
  return { dia, semana: `${fecha.getUTCFullYear()}-W${String(semana).padStart(2, '0')}` };
}

// Devuelve el progreso guardado solo si sigue vigente; si el día o la semana cambió, empieza de cero.
export function progresoVigente(guardado, periodo) {
  const hechasDia = guardado?.dia === periodo.dia ? guardado.hechasDia : [];
  const hechasSemana = guardado?.semana === periodo.semana ? guardado.hechasSemana : [];
  return { dia: periodo.dia, semana: periodo.semana, hechasDia, hechasSemana };
}
