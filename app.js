import { iniciarHoy } from './hoy.js';
import { iniciarJuego } from './juego.js';
import { pintarBarra } from './barra.js';
import {
  alternarTarea,
  crearTarea,
  eliminarTarea,
  filtrarTareas,
  fusionarTareas,
  validarTitulo,
} from './tareas.mjs';

const CLAVE_ALMACENAMIENTO = 'pendientes.v1';

const formulario = document.getElementById('formulario');
const entrada = document.getElementById('nueva-tarea');
const error = document.getElementById('error');
const lista = document.getElementById('lista');
const vacio = document.getElementById('vacio');
const resumen = document.getElementById('resumen');
const botonesFiltro = document.querySelectorAll('[data-filtro]');

let tareas = cargarTareas();
let filtroActual = 'todas';

// El almacenamiento local puede fallar (modo privado, datos bloqueados).
// En ese caso la app sigue funcionando, solo sin guardar entre sesiones.
function cargarTareas() {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    const datos = guardado ? JSON.parse(guardado) : [];
    return Array.isArray(datos) ? datos : [];
  } catch (err) {
    console.warn('No se pudieron leer los pendientes guardados:', err);
    return [];
  }
}

function guardarTareas() {
  try {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(tareas));
  } catch (err) {
    console.warn('No se pudieron guardar los pendientes:', err);
  }
}

function crearId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function crearElementoTarea(tarea) {
  const li = document.createElement('li');
  li.className = tarea.hecha ? 'tarea hecha' : 'tarea';

  const casilla = document.createElement('input');
  casilla.type = 'checkbox';
  casilla.checked = tarea.hecha;
  casilla.setAttribute('aria-label', `Marcar "${tarea.titulo}" como hecha`);
  casilla.addEventListener('change', () => {
    tareas = alternarTarea(tareas, tarea.id);
    guardarTareas();
    render();
  });

  const texto = document.createElement('span');
  texto.className = 'titulo';
  texto.textContent = tarea.titulo;

  const borrar = document.createElement('button');
  borrar.type = 'button';
  borrar.className = 'eliminar';
  borrar.textContent = 'Borrar';
  borrar.setAttribute('aria-label', `Borrar "${tarea.titulo}"`);
  borrar.addEventListener('click', () => {
    tareas = eliminarTarea(tareas, tarea.id);
    guardarTareas();
    render();
  });

  li.append(casilla, texto, borrar);
  return li;
}

function render() {
  const visibles = filtrarTareas(tareas, filtroActual);
  lista.replaceChildren(...visibles.map(crearElementoTarea));
  vacio.hidden = visibles.length > 0;

  const pendientes = tareas.filter((t) => !t.hecha).length;
  resumen.textContent = pendientes === 1 ? '1 pendiente' : `${pendientes} pendientes`;
  pintarBarra(
    document.getElementById('progreso-tareas'),
    tareas.length - pendientes,
    tareas.length,
    'Tareas hechas',
  );
  pintarBarra(document.getElementById('progreso-contenido'), 0, 0, 'Contenido publicado');

  botonesFiltro.forEach((boton) => {
    boton.setAttribute('aria-pressed', String(boton.dataset.filtro === filtroActual));
  });
}

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const titulo = entrada.value;
  if (!validarTitulo(titulo)) {
    error.hidden = false;
    return;
  }
  error.hidden = true;
  tareas = [...tareas, crearTarea(titulo, crearId())];
  entrada.value = '';
  guardarTareas();
  render();
});

botonesFiltro.forEach((boton) => {
  boton.addEventListener('click', () => {
    filtroActual = boton.dataset.filtro;
    render();
  });
});

// Navegación entre secciones (barra inferior en móvil, lateral en computadora).
const botonesVista = document.querySelectorAll('[data-vista]:is(button)');
const vistas = document.querySelectorAll('section.vista');

function mostrarVista(nombre) {
  vistas.forEach((vista) => {
    vista.classList.toggle('activa', vista.dataset.vista === nombre);
  });
  botonesVista.forEach((boton) => {
    boton.setAttribute('aria-pressed', String(boton.dataset.vista === nombre));
  });
}

botonesVista.forEach((boton) => {
  boton.addEventListener('click', () => mostrarVista(boton.dataset.vista));
});

// Importa pendientes desde semana.json (archivo local, no versionado).
// Si el archivo no existe, la app funciona igual.
async function importarSemana() {
  try {
    const respuesta = await fetch('semana.json', { cache: 'no-store' });
    if (!respuesta.ok) return;
    const importadas = await respuesta.json();
    if (!Array.isArray(importadas)) return;
    const antes = tareas.length;
    tareas = fusionarTareas(tareas, importadas);
    if (tareas.length !== antes) {
      guardarTareas();
      render();
    }
  } catch (err) {
    console.warn('No se pudo importar semana.json:', err);
  }
}

render();
importarSemana();
iniciarHoy();
iniciarJuego();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((err) => {
    console.warn('No se pudo registrar el service worker:', err);
  });
}
