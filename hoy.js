import { marcarMeta, repartirMetas } from './organizador.mjs';
import { pintarBarra } from './barra.js';

// Metas diarias. Son provisionales: se pueden editar o quitar en cualquier momento.
const METAS_INICIALES = [
  { id: 'beat', nombre: 'Hacer un beat', hecha: false },
  { id: 'cancion', nombre: 'Hacer una canción', hecha: false },
  { id: 'foto', nombre: '1 foto', hecha: false },
  { id: 'videos', nombre: '3 a 5 videos', hecha: false },
  { id: 'comentarios', nombre: 'Contestar todos los comentarios', hecha: false },
  { id: 'ejercicio', nombre: 'Hacer ejercicio', hecha: false },
  { id: 'grabar', nombre: 'Grabar, tomar fotos y editar', hecha: false },
  { id: 'universidad', nombre: 'Trabajo de la universidad', hecha: false },
  { id: 'oracion', nombre: 'Orar', hecha: false },
];

const CLAVE_HOY = 'xth.hoy.v1';

function leerHoy() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_HOY) ?? 'null');
    return guardado ?? { metas: METAS_INICIALES, horas: '' };
  } catch (err) {
    console.warn('No se pudo leer el plan de hoy:', err);
    return { metas: METAS_INICIALES, horas: '' };
  }
}

function guardarHoy(estado) {
  try {
    localStorage.setItem(CLAVE_HOY, JSON.stringify(estado));
  } catch (err) {
    console.warn('No se pudo guardar el plan de hoy:', err);
  }
}

// Convierte "09:00, 14:00" en ["09:00", "14:00"] y descarta lo que no sea hora.
function parsearHoras(texto) {
  return texto
    .split(',')
    .map((h) => h.trim())
    .filter((h) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h));
}

export function iniciarHoy() {
  const horasInput = document.getElementById('horas-libres');
  const listaMetas = document.getElementById('metas');
  const plan = document.getElementById('plan');
  let estado = leerHoy();
  horasInput.value = estado.horas;

  function render() {
    listaMetas.replaceChildren(
      ...estado.metas.map((meta) => {
        const li = document.createElement('li');
        li.className = meta.hecha ? 'tarea hecha' : 'tarea';
        const casilla = document.createElement('input');
        casilla.type = 'checkbox';
        casilla.checked = meta.hecha;
        casilla.setAttribute('aria-label', `Marcar "${meta.nombre}" como hecha`);
        casilla.addEventListener('change', () => {
          estado = { ...estado, metas: marcarMeta(estado.metas, meta.id) };
          guardarHoy(estado);
          render();
        });
        const texto = document.createElement('span');
        texto.className = 'titulo';
        texto.textContent = meta.nombre;
        li.append(casilla, texto);
        return li;
      }),
    );

    const hechas = estado.metas.filter((meta) => meta.hecha).length;
    pintarBarra(document.getElementById('progreso-hoy'), hechas, estado.metas.length, 'Metas de hoy');

    const asignaciones = repartirMetas(estado.metas, parsearHoras(estado.horas));
    plan.replaceChildren(
      ...asignaciones.map(({ hora, meta }) => {
        const li = document.createElement('li');
        li.textContent = `${hora} · ${meta.nombre}`;
        return li;
      }),
    );
    if (asignaciones.length === 0) {
      const aviso = document.createElement('li');
      aviso.textContent = 'Escribe tus horas libres para repartir las metas.';
      plan.replaceChildren(aviso);
    }
  }

  horasInput.addEventListener('input', () => {
    estado = { ...estado, horas: horasInput.value };
    guardarHoy(estado);
    render();
  });

  render();
}
