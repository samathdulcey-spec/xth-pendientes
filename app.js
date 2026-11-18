import { iniciarJuego } from './juego.js';
import { iniciarAvatar } from './avatar.js';
import { iniciarContenido } from './contenido.js';
import { crearMob } from './mobs.js';
import { agruparPorCategoria } from './categorias.mjs';
import { deducirCategoria, deducirFecha } from './deducir.mjs';
import { OBJETIVOS, periodoDe, progresoVigente, puntosAlCompletar } from './misiones.mjs';
import { PUNTOS } from './reglas.mjs';
import { alternarTarea, crearTarea, eliminarTarea, fusionarTareas, validarTitulo } from './tareas.mjs';

const CLAVE_TAREAS = 'pendientes.v1';
const CLAVE_HOY = 'xth.hoy.v1';
const CLAVE_MISIONES = 'xth.misiones.v1';
const CLAVE_MIGRACION = 'xth.objetivos.migrados.v2';
const formulario = document.getElementById('formulario');
const entrada = document.getElementById('nueva-tarea');
const urgenteInput = document.getElementById('nueva-urgente');
const error = document.getElementById('error');
const carpetas = document.getElementById('carpetas');
let tareas = leerLista(CLAVE_TAREAS);
let periodo = periodoDe(new Date());
let misiones = progresoVigente(leerJSON(CLAVE_MISIONES), periodo);

function leerJSON(clave) {
  try { return JSON.parse(localStorage.getItem(clave) ?? 'null'); }
  catch (err) { console.warn(`No se pudo leer ${clave}:`, err); return null; }
}

function leerLista(clave) {
  const valor = leerJSON(clave);
  return Array.isArray(valor) ? valor : [];
}

function guardarTareas() {
  try { localStorage.setItem(CLAVE_TAREAS, JSON.stringify(tareas)); }
  catch (err) { console.warn('No se pudieron guardar las tareas:', err); }
}

function crearId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizarNombre(texto) {
  return texto.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace('contestar todos los comentarios', 'contestar comentarios')
    .replace('tomar fotos', 'fotos').replace(/[^a-z0-9]+/g, ' ').trim();
}

function objetivoDe(tarea) {
  const titulo = normalizarNombre(tarea.titulo);
  return OBJETIVOS.find((objetivo) => normalizarNombre(objetivo.nombre) === titulo) ?? null;
}

function guardarMisiones() {
  try { localStorage.setItem(CLAVE_MISIONES, JSON.stringify(misiones)); }
  catch (err) { console.warn('No se pudo guardar el progreso de objetivos:', err); }
}

// Migra el estado anterior de Hoy y las tareas duplicadas a la lista única de objetivos.
function migrarObjetivosAnteriores() {
  try { if (localStorage.getItem(CLAVE_MIGRACION) === '1') return; }
  catch { return; }
  const estadoHoy = leerJSON(CLAVE_HOY);
  const metas = Array.isArray(estadoHoy?.metas) ? estadoHoy.metas : [];
  let cambio = false;
  for (const meta of metas) {
    const objetivo = OBJETIVOS.find((item) => normalizarNombre(item.nombre) === normalizarNombre(meta.nombre))
      ?? OBJETIVOS.find((item) => item.id === meta.id);
    if (!objetivo || !meta.hecha) continue;
    const clave = objetivo.periodo === 'dia' ? 'hechasDia' : 'hechasSemana';
    if (!misiones[clave].includes(objetivo.id)) {
      misiones = { ...misiones, [clave]: [...misiones[clave], objetivo.id] };
      cambio = true;
    }
  }
  for (const tarea of tareas) {
    const objetivo = objetivoDe(tarea);
    if (!objetivo || !tarea.hecha) continue;
    const clave = objetivo.periodo === 'dia' ? 'hechasDia' : 'hechasSemana';
    if (!misiones[clave].includes(objetivo.id)) {
      misiones = { ...misiones, [clave]: [...misiones[clave], objetivo.id] };
      cambio = true;
    }
  }
  if (cambio) guardarMisiones();
  try { localStorage.setItem(CLAVE_MIGRACION, '1'); }
  catch (err) { console.warn('No se pudo registrar la migración de objetivos:', err); }
}

function agregarTarea(titulo, urgente) {
  if (!validarTitulo(titulo)) return false;
  const categoria = deducirCategoria(titulo);
  const fecha = deducirFecha(titulo);
  tareas = [...tareas, {
    ...crearTarea(titulo, crearId(), undefined, categoria, fecha),
    urgente,
    destinos: { calendario: fecha ? { fecha } : null, drive: { grupo: categoria } },
    recompensada: false,
    penalizacionAplicada: false,
  }];
  guardarTareas();
  render();
  return true;
}

function filaTarea(tarea) {
  const fila = document.createElement('li');
  fila.className = tarea.hecha ? 'tarea hecha' : 'tarea';
  const casilla = document.createElement('input');
  casilla.type = 'checkbox';
  casilla.checked = tarea.hecha;
  casilla.setAttribute('aria-label', `Marcar la tarea "${tarea.titulo}" como hecha`);
  casilla.addEventListener('change', () => {
    const completar = casilla.checked;
    const actual = tareas.find((item) => item.id === tarea.id);
    tareas = alternarTarea(tareas, tarea.id).map((item) => item.id === tarea.id
      ? { ...item, recompensada: item.recompensada || completar }
      : item);
    guardarTareas();
    if (completar && !actual.recompensada) {
      const aTiempo = !tarea.vence || tarea.vence >= new Date().toISOString().slice(0, 10);
      const puntos = aTiempo ? PUNTOS.metaNormal + PUNTOS.bonusATiempo : PUNTOS.metaUltimaHora;
      window.dispatchEvent(new CustomEvent('xth-premiar-tarea', { detail: { puntos } }));
    }
    render();
  });

  const texto = document.createElement('span');
  texto.className = 'titulo';
  texto.textContent = tarea.titulo;
  const destinos = document.createElement('small');
  destinos.className = 'destinos-tarea';
  const fecha = tarea.destinos?.calendario?.fecha ?? tarea.vence;
  destinos.textContent = `${fecha ? `Calendar: ${fecha} · ` : ''}Drive: ${tarea.destinos?.drive?.grupo ?? tarea.categoria ?? 'Otros'}`;

  const borrar = document.createElement('button');
  borrar.type = 'button';
  borrar.className = 'eliminar';
  borrar.textContent = 'Borrar';
  borrar.setAttribute('aria-label', `Borrar la tarea "${tarea.titulo}"`);
  borrar.addEventListener('click', () => {
    tareas = eliminarTarea(tareas, tarea.id);
    guardarTareas();
    render();
  });
  fila.append(casilla, texto, destinos, borrar);
  return fila;
}

function filaObjetivo(objetivo, hecha) {
  const fila = document.createElement('li');
  fila.className = hecha ? 'tarea hecha objetivo' : 'tarea objetivo';
  const casilla = document.createElement('input');
  casilla.type = 'checkbox';
  casilla.checked = hecha;
  casilla.disabled = hecha;
  casilla.setAttribute('aria-label', `Completar objetivo: ${objetivo.nombre}`);
  casilla.addEventListener('change', () => {
    if (casilla.checked) {
      window.dispatchEvent(new CustomEvent('xth-completar-objetivo', {
        detail: { id: objetivo.id, periodo: objetivo.periodo, puntos: puntosAlCompletar(objetivo) },
      }));
    }
  });
  const texto = document.createElement('span');
  texto.className = 'titulo';
  texto.textContent = `${objetivo.nombre} (+${puntosAlCompletar(objetivo)})`;
  fila.append(casilla, texto);
  return fila;
}

function crearGrupo(grupo, objetivos, hechosDia, hechosSemana) {
  const tarjeta = document.createElement('section');
  tarjeta.className = 'carpeta';
  tarjeta.setAttribute('aria-label', grupo.nombre);
  const cabecera = document.createElement('header');
  cabecera.className = 'carpeta-cabecera';
  const titulo = document.createElement('h3');
  titulo.textContent = grupo.nombre;
  cabecera.append(crearMob(grupo.mob, 30), titulo);

  const pendientes = [];
  const hechas = [];
  const objetivosGrupo = objetivos.filter((objetivo) => objetivo.categoria === grupo.id);
  for (const objetivo of objetivosGrupo) {
    const hechasPeriodo = objetivo.periodo === 'dia' ? hechosDia : hechosSemana;
    const hecha = hechasPeriodo.includes(objetivo.id);
    (hecha ? hechas : pendientes).push(filaObjetivo(objetivo, hecha));
  }
  for (const tarea of grupo.tareas) {
    if (objetivoDe(tarea)) continue;
    (tarea.hecha ? hechas : pendientes).push(filaTarea(tarea));
  }

  const crearLista = (tituloLista, filas) => {
    const bloque = document.createElement('section');
    bloque.className = 'subgrupo-tareas';
    const h4 = document.createElement('h4');
    h4.textContent = `${tituloLista} (${filas.length})`;
    const lista = document.createElement('ul');
    lista.className = 'lista';
    lista.replaceChildren(...filas);
    bloque.append(h4, lista);
    return bloque;
  };
  tarjeta.append(cabecera, crearLista('Pendientes', pendientes), crearLista('Hechas', hechas));
  return tarjeta;
}

function pintarUrgentes() {
  const contenedor = document.getElementById('urgentes-hoy');
  const urgentes = tareas.filter((tarea) => tarea.urgente === true && !tarea.hecha);
  if (!urgentes.length) { contenedor.replaceChildren(); return; }
  const titulo = document.createElement('h3');
  titulo.className = 'urgente-titulo';
  titulo.textContent = `¡URGENTE! (${urgentes.length})`;
  const lista = document.createElement('ul');
  lista.className = 'urgente-lista';
  lista.replaceChildren(...urgentes.map((tarea) => {
    const elemento = document.createElement('li');
    elemento.textContent = tarea.vence ? `${tarea.titulo} — ${tarea.vence}` : tarea.titulo;
    return elemento;
  }));
  contenedor.replaceChildren(titulo, lista);
}

function render() {
  const objetivos = OBJETIVOS;
  const tareasNoDuplicadas = tareas.filter((tarea) => !objetivoDe(tarea));
  carpetas.replaceChildren(...agruparPorCategoria(tareasNoDuplicadas).map((grupo) =>
    crearGrupo(grupo, objetivos, misiones.hechasDia, misiones.hechasSemana)));
  pintarUrgentes();
}

function comprobarVencidas() {
  const hoy = new Date().toISOString().slice(0, 10);
  let cambio = false;
  tareas = tareas.map((tarea) => {
    if (tarea.hecha || !tarea.vence || tarea.vence >= hoy || tarea.penalizacionAplicada) return tarea;
    cambio = true;
    window.dispatchEvent(new Event('xth-strike'));
    return { ...tarea, penalizacionAplicada: true };
  });
  if (cambio) guardarTareas();
}

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  if (!agregarTarea(entrada.value, urgenteInput.checked)) { error.hidden = false; return; }
  error.hidden = true;
  entrada.value = '';
  urgenteInput.checked = false;
});

async function importarSemana() {
  try {
    const respuesta = await fetch('semana.json', { cache: 'no-store' });
    if (!respuesta.ok) return;
    const importadas = await respuesta.json();
    if (!Array.isArray(importadas)) return;
    const antes = tareas.length;
    tareas = fusionarTareas(tareas, importadas);
    if (tareas.length !== antes) { guardarTareas(); render(); }
  } catch (err) { console.warn('No se pudo importar semana.json:', err); }
}

migrarObjetivosAnteriores();
render();
iniciarJuego();
iniciarAvatar();
iniciarContenido();
comprobarVencidas();
window.addEventListener('xth-misiones-change', () => {
  periodo = periodoDe(new Date());
  misiones = progresoVigente(leerJSON(CLAVE_MISIONES), periodo);
  render();
});
setInterval(() => {
  window.dispatchEvent(new Event('xth-periodo-check'));
  comprobarVencidas();
}, 60_000);
importarSemana();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((err) => {
    console.warn('No se pudo registrar el service worker:', err);
  });
}
