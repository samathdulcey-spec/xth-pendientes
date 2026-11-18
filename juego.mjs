// Motor del juego de metas: puntos, strikes, corazones, retos y tienda.
// Sin DOM ni almacenamiento. Cada función devuelve un estado nuevo.
// Supuestos (confirmar): empieza con 0 corazones perdidos; comprar un corazón
// restaura uno perdido; los puntos pueden no bajar de 0 al penalizar.

export { PUNTOS, STRIKES_POR_PARTIDA, VIDAS_TOTALES, META_MENSUAL } from './reglas.mjs';
import { PUNTOS, STRIKES_POR_PARTIDA, VIDAS_TOTALES } from './reglas.mjs';

export function estadoInicial() {
  return { puntos: 0, strikes: 0, corazonesPerdidos: 0, retosPendientes: 0, muerto: false, mes: null };
}

function sumarPuntos(estado, cantidad) {
  return { ...estado, puntos: estado.puntos + cantidad };
}

function registrarStrike(estado) {
  if (estado.muerto) return estado;
  const strikes = Math.min(STRIKES_POR_PARTIDA, estado.strikes + 1);
  const muerto = strikes >= STRIKES_POR_PARTIDA;
  return {
    ...estado,
    strikes,
    corazonesPerdidos: muerto ? VIDAS_TOTALES : estado.corazonesPerdidos,
    muerto,
  };
}

export function registrarMeta(estado, { aTiempo }) {
  if (!aTiempo) return sumarPuntos(estado, PUNTOS.metaUltimaHora);
  return sumarPuntos(estado, PUNTOS.metaNormal + PUNTOS.bonusATiempo);
}

export function registrarOracion(estado) {
  return sumarPuntos(estado, PUNTOS.oracion);
}

export function registrarIglesia(estado) {
  return sumarPuntos(estado, PUNTOS.iglesia);
}

export function registrarOmision(estado) {
  return registrarStrike(estado);
}

export function penalizarError(estado) {
  return sumarPuntos(estado, -PUNTOS.perdidaError);
}

const CAMPOS_ENTEROS = ['puntos', 'strikes', 'corazonesPerdidos', 'retosPendientes'];

// Valida lo que llega del almacenamiento local. Cualquier valor inválido
// vuelve al estado inicial en lugar de romper la pantalla.
export function normalizarEstado(datos) {
  if (typeof datos !== 'object' || datos === null) return estadoInicial();
  const valido = CAMPOS_ENTEROS.every(
    (campo) => Number.isInteger(datos[campo]) && (campo === 'puntos' || datos[campo] >= 0),
  );
  if (!valido) return estadoInicial();
  const strikes = Math.min(datos.strikes, STRIKES_POR_PARTIDA);
  const muerto = datos.muerto === true || strikes >= STRIKES_POR_PARTIDA;
  return {
    ...Object.fromEntries(CAMPOS_ENTEROS.map((campo) => [campo, datos[campo]])),
    strikes,
    muerto,
    corazonesPerdidos: muerto ? VIDAS_TOTALES : 0,
    mes: typeof datos.mes === 'string' ? datos.mes : null,
  };
}

// Suma los puntos de una misión completada.
export function registrarMision(estado, puntos) {
  return sumarPuntos(estado, puntos);
}

export function reiniciarPartida(estado) {
  return { ...estado, strikes: 0, corazonesPerdidos: 0, retosPendientes: 0, muerto: false };
}

export function asegurarMes(estado, mes) {
  if (!estado.mes || estado.mes === mes) return { ...estado, mes };
  return { ...estado, mes, puntos: 0, strikes: 0, corazonesPerdidos: 0, retosPendientes: 0, muerto: false };
}
