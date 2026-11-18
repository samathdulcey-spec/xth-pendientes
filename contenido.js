import { crearMob } from './mobs.js';
import { DIAS_ENTRE_REDES, planificarArchivo } from './publicaciones.mjs';

const REDES = ['tiktok', 'instagram', 'facebook'];
const NOMBRES_RED = { tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook' };

async function leerContenido() {
  try {
    const respuesta = await fetch('contenido.json', { cache: 'no-store' });
    if (!respuesta.ok) return null;
    return await respuesta.json();
  } catch (err) {
    console.warn('No se pudo leer contenido.json:', err);
    return null;
  }
}

function hoyISO() {
  const fecha = new Date();
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function tarjetaArchivo(archivo, plan) {
  const tarjeta = document.createElement('li');
  tarjeta.className = 'archivo-contenido';
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'archivo-toggle';
  boton.setAttribute('aria-expanded', 'false');
  const estado = plan.some((paso) => paso.estado === 'programado') ? 'Programada' : 'No programada';
  boton.textContent = `${archivo.nombre} · ${estado}`;
  const detalle = document.createElement('div');
  detalle.className = 'detalle-archivo';
  detalle.hidden = true;
  const lista = document.createElement('ul');
  lista.className = 'plan-redes';
  lista.replaceChildren(...plan.map((paso) => {
    const elemento = document.createElement('li');
    elemento.textContent = `${NOMBRES_RED[paso.red]} · ${paso.fecha} · ${paso.estado}`;
    return elemento;
  }));
  const aprobacion = document.createElement('p');
  aprobacion.textContent = 'Cada publicación queda pendiente de tu aprobación.';
  detalle.append(lista, aprobacion);
  boton.addEventListener('click', () => {
    detalle.hidden = !detalle.hidden;
    boton.setAttribute('aria-expanded', String(!detalle.hidden));
  });
  tarjeta.append(boton, detalle);
  return tarjeta;
}

function listaContenido(titulo, archivos, planes, vacioTexto) {
  const seccion = document.createElement('section');
  seccion.className = 'lista-contenido-seccion';
  const encabezado = document.createElement('h3');
  encabezado.textContent = titulo;
  const lista = document.createElement('ul');
  lista.className = 'lista';
  if (archivos.length) {
    lista.replaceChildren(...archivos.map((archivo) => tarjetaArchivo(archivo, planes.get(archivo))));
  } else {
    const vacio = document.createElement('li');
    vacio.className = 'contenido-vacio';
    vacio.textContent = vacioTexto;
    lista.append(vacio);
  }
  seccion.append(encabezado, lista);
  return seccion;
}

export async function iniciarContenido() {
  const panel = document.getElementById('contenido-panel');
  if (!panel) return;
  const datos = await leerContenido();
  const cabecera = document.createElement('div');
  cabecera.className = 'contenido-cabecera';
  cabecera.append(crearMob('zombi', 36));
  const texto = document.createElement('p');
  texto.textContent = datos
    ? `Drive: ${datos.carpeta} · revisado ${datos.actualizado} · espera ${DIAS_ENTRE_REDES} días entre redes.`
    : 'No hay datos de Drive todavía.';
  cabecera.append(texto);
  const hijos = [cabecera];
  if (datos?.enlace?.startsWith('https://drive.google.com/')) {
    const enlace = document.createElement('a');
    enlace.className = 'boton-enlace';
    enlace.href = datos.enlace;
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
    enlace.textContent = 'Abrir carpeta de Drive';
    hijos.push(enlace);
  }

  const hoy = hoyISO();
  const archivos = Array.isArray(datos?.archivos) ? datos.archivos : [];
  const planes = new Map(archivos.map((archivo) => [archivo, planificarArchivo(archivo, REDES, hoy)]));
  const programadas = archivos.filter((archivo) => planes.get(archivo).some((paso) => paso.estado === 'programado'));
  const noProgramadas = archivos.filter((archivo) => !programadas.includes(archivo));
  hijos.push(listaContenido('Programadas', programadas, planes, 'No hay publicaciones programadas.'));
  hijos.push(listaContenido('No programadas · próximas', noProgramadas, planes, archivos.length
    ? 'Todo el contenido disponible ya tiene programación.'
    : 'No hay archivos en Drive todavía.'));
  panel.replaceChildren(...hijos);
}
