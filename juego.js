import { asegurarMes, estadoInicial, normalizarEstado, registrarMision, registrarOmision, reiniciarPartida } from './juego.mjs';
import { META_MENSUAL, PREMIOS, VIDAS_TOTALES } from './reglas.mjs';
import { crearMob } from './mobs.js';
import { periodoDe, progresoVigente } from './misiones.mjs';

const CLAVE_JUEGO = 'xth.juego.v1';
const CLAVE_MISIONES = 'xth.misiones.v1';

function leerJSON(clave) {
  try { return JSON.parse(localStorage.getItem(clave) ?? 'null'); }
  catch (err) { console.warn(`No se pudo leer ${clave}:`, err); return null; }
}

function guardarJSON(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); }
  catch (err) { console.warn(`No se pudo guardar ${clave}:`, err); }
}

function mesActual() { return new Date().toISOString().slice(0, 7); }

export function iniciarJuego() {
  const contenedor = document.getElementById('juego-panel');
  if (!contenedor) return;
  let estado = asegurarMes(normalizarEstado(leerJSON(CLAVE_JUEGO) ?? estadoInicial()), mesActual());
  let periodo = periodoDe(new Date());
  let misiones = progresoVigente(leerJSON(CLAVE_MISIONES), periodo);
  guardarJSON(CLAVE_JUEGO, estado);
  guardarJSON(CLAVE_MISIONES, misiones);

  function actualizar(nuevoEstado, mensaje) {
    estado = nuevoEstado;
    guardarJSON(CLAVE_JUEGO, estado);
    render();
    if (mensaje) celebrar(mensaje);
  }

  function celebrar(texto) {
    const destello = document.createElement('div');
    destello.className = 'ganancia';
    destello.setAttribute('role', 'status');
    destello.textContent = texto;
    contenedor.append(destello);
    destello.addEventListener('animationend', () => destello.remove());
    for (let i = 0; i < 8; i += 1) {
      const particula = document.createElement('span');
      particula.className = 'particula';
      particula.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 140)}px`);
      particula.style.setProperty('--dy', `${Math.round(-24 - Math.random() * 72)}px`);
      contenedor.append(particula);
      particula.addEventListener('animationend', () => particula.remove());
    }
  }

  function completar(evento) {
    const { id, periodo: tipo, puntos } = evento.detail ?? {};
    if (estado.muerto || !id || !['dia', 'semana'].includes(tipo)) return;
    const clave = tipo === 'dia' ? 'hechasDia' : 'hechasSemana';
    if (misiones[clave].includes(id)) return;
    misiones = { ...misiones, [clave]: [...misiones[clave], id] };
    guardarJSON(CLAVE_MISIONES, misiones);
    const siguiente = registrarMision(estado, Number.isFinite(puntos) ? puntos : 0);
    actualizar(siguiente, Number.isFinite(puntos) && puntos > 0 ? `+${puntos}` : null);
    window.dispatchEvent(new Event('xth-misiones-change'));
  }

  function puntuarTarea(evento) {
    const puntos = Number(evento.detail?.puntos);
    if (estado.muerto || !Number.isFinite(puntos) || puntos <= 0) return;
    actualizar(registrarMision(estado, puntos), `+${puntos}`);
  }

  function recibirStrike() {
    const antes = estado.muerto;
    actualizar(registrarOmision(estado), antes ? null : estado.strikes + 1 >= 3 ? 'Partida perdida' : 'Strike');
  }

  window.addEventListener('xth-completar-objetivo', completar);
  window.addEventListener('xth-premiar-tarea', puntuarTarea);
  window.addEventListener('xth-strike', recibirStrike);
  window.addEventListener('xth-periodo-check', () => {
    const nuevoPeriodo = periodoDe(new Date());
    const cambiaMes = mesActual() !== estado.mes;
    const cambiaPeriodo = nuevoPeriodo.dia !== periodo.dia || nuevoPeriodo.semana !== periodo.semana;
    if (cambiaMes) {
      estado = asegurarMes(estado, mesActual());
      guardarJSON(CLAVE_JUEGO, estado);
    }
    if (cambiaPeriodo) {
      periodo = nuevoPeriodo;
      misiones = progresoVigente(misiones, periodo);
      guardarJSON(CLAVE_MISIONES, misiones);
      window.dispatchEvent(new Event('xth-misiones-change'));
    }
    if (cambiaMes || cambiaPeriodo) render();
  });

  function reiniciar() { actualizar(reiniciarPartida(estado), 'Partida reiniciada'); }

  function render() {
    const marcador = document.createElement('dl');
    marcador.className = 'marcador';
    const puntos = document.createElement('div');
    puntos.className = 'celda-puntos';
    const puntosLabel = document.createElement('dt');
    puntosLabel.textContent = 'Puntos este mes';
    const puntosValor = document.createElement('dd');
    puntosValor.textContent = estado.puntos.toLocaleString('es-ES');
    puntos.append(puntosLabel, puntosValor);

    const vidas = document.createElement('div');
    vidas.className = 'celda-vidas';
    const vidasLabel = document.createElement('dt');
    vidasLabel.textContent = 'Vidas';
    const vidasValor = document.createElement('dd');
    vidasValor.className = 'corazones';
    for (let i = 0; i < VIDAS_TOTALES; i += 1) {
      const vivo = i < VIDAS_TOTALES - estado.corazonesPerdidos;
      const corazon = crearMob(vivo ? 'corazon' : 'corazonVacio', 22);
      corazon.classList.add(vivo ? 'corazon-vivo' : 'corazon-vacio');
      vidasValor.append(corazon);
    }
    vidas.append(vidasLabel, vidasValor);

    const strikes = document.createElement('div');
    const strikesLabel = document.createElement('dt');
    strikesLabel.textContent = 'Strikes';
    const strikesValor = document.createElement('dd');
    strikesValor.textContent = `${estado.strikes} de 3`;
    strikes.append(strikesLabel, strikesValor);
    marcador.append(puntos, vidas, strikes);

    const progreso = document.createElement('section');
    progreso.className = 'progreso-mensual';
    const meta = document.createElement('label');
    meta.textContent = `Meta mensual: ${estado.puntos.toLocaleString('es-ES')} / ${META_MENSUAL.toLocaleString('es-ES')}`;
    const barra = document.createElement('progress');
    barra.max = META_MENSUAL;
    barra.value = Math.min(META_MENSUAL, Math.max(0, estado.puntos));
    barra.setAttribute('aria-label', 'Progreso hacia la meta mensual de puntos');
    progreso.append(meta, barra);

    const contenido = [marcador, progreso];
    if (estado.muerto) {
      const aviso = document.createElement('p');
      aviso.className = 'juego-muerto';
      aviso.setAttribute('role', 'alert');
      aviso.textContent = 'Partida perdida: llegaste a 3 strikes.';
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.textContent = 'Reiniciar partida';
      boton.addEventListener('click', reiniciar);
      contenido.push(aviso, boton);
    } else {
      const tienda = document.createElement('div');
      tienda.className = 'tienda';
      for (const premio of PREMIOS) {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.textContent = `${premio.nombre} (−${premio.precio})`;
        boton.disabled = estado.puntos < premio.precio;
        boton.addEventListener('click', () => actualizar({ ...estado, puntos: estado.puntos - premio.precio }, `Canjeado: ${premio.nombre}`));
        tienda.append(boton);
      }
      contenido.push(tienda);
    }
    contenedor.replaceChildren(...contenido);
  }

  render();
}
