import { pintarBarra } from './barra.js';
import {
  comprarCorazon,
  CORAZONES_POR_RETO,
  estadoInicial,
  normalizarEstado,
  penalizarError,
  PUNTOS,
  registrarIglesia,
  registrarMeta,
  registrarOmision,
  registrarOracion,
} from './juego.mjs';

const CLAVE_JUEGO = 'xth.juego.v1';

// Cada acción del panel: id del botón, texto visible y función del motor.
const ACCIONES = [
  { id: 'meta-tiempo', texto: `Meta hecha a tiempo (+${PUNTOS.metaNormal + PUNTOS.bonusATiempo})`, aplicar: (e) => registrarMeta(e, { aTiempo: true }) },
  { id: 'meta-ultima', texto: `Meta a última hora (+${PUNTOS.metaUltimaHora})`, aplicar: (e) => registrarMeta(e, { aTiempo: false }) },
  { id: 'oracion', texto: `Oración (+${PUNTOS.oracion})`, aplicar: registrarOracion },
  { id: 'iglesia', texto: `Ir a la iglesia (+${PUNTOS.iglesia})`, aplicar: registrarIglesia },
  { id: 'error', texto: `Error u omisión de datos (−${PUNTOS.perdidaError})`, aplicar: penalizarError },
  { id: 'omision', texto: 'Meta incumplida (+1 strike)', aplicar: registrarOmision },
];

function leerJuego() {
  try {
    return normalizarEstado(JSON.parse(localStorage.getItem(CLAVE_JUEGO) ?? 'null'));
  } catch (err) {
    console.warn('No se pudo leer el juego guardado:', err);
    return estadoInicial();
  }
}

function guardarJuego(estado) {
  try {
    localStorage.setItem(CLAVE_JUEGO, JSON.stringify(estado));
  } catch (err) {
    console.warn('No se pudo guardar el juego:', err);
  }
}

function crearBoton(texto, onClick, id) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.textContent = texto;
  if (id) boton.dataset.accion = id;
  boton.addEventListener('click', onClick);
  return boton;
}

export function iniciarJuego() {
  const contenedor = document.getElementById('juego-panel');
  if (!contenedor) return;
  let estado = leerJuego();

  function actualizar(nuevoEstado) {
    estado = nuevoEstado;
    guardarJuego(estado);
    render();
  }

  function render() {
    const compra = estado.puntos >= PUNTOS.corazon && estado.corazonesPerdidos > 0;
    const retoFaltante = CORAZONES_POR_RETO - (estado.corazonesPerdidos % CORAZONES_POR_RETO);

    const marcador = document.createElement('dl');
    marcador.className = 'marcador';
    [
      ['Puntos', estado.puntos],
      ['Strikes (de 2)', `${estado.strikes}/2`],
      ['Corazones perdidos', estado.corazonesPerdidos],
      ['Retos pendientes', estado.retosPendientes],
      ['Faltan para el próximo reto', `${retoFaltante} corazón(es)`],
    ].forEach(([nombre, valor]) => {
      const dt = document.createElement('dt');
      dt.textContent = nombre;
      const dd = document.createElement('dd');
      dd.textContent = String(valor);
      marcador.append(dt, dd);
    });

    const avanceReto = CORAZONES_POR_RETO - retoFaltante;
    const bloqueProgreso = document.createElement('div');
    bloqueProgreso.className = 'progreso';
    pintarBarra(bloqueProgreso, avanceReto, CORAZONES_POR_RETO, 'Camino al próximo reto');

    const acciones = document.createElement('div');
    acciones.className = 'acciones';
    acciones.replaceChildren(
      ...ACCIONES.map((accion) => crearBoton(accion.texto, () => actualizar(accion.aplicar(estado)), accion.id)),
    );

    const tienda = document.createElement('div');
    tienda.className = 'tienda';
    tienda.append(
      crearBoton(`Comprar corazón (−${PUNTOS.corazon})`, () => actualizar(comprarCorazon(estado)), 'comprar'),
    );
    tienda.querySelector('button').disabled = !compra;

    contenedor.replaceChildren(marcador, bloqueProgreso, acciones, tienda);
  }

  render();
}
