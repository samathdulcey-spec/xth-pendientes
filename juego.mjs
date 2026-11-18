// Motor del juego de metas: puntos, strikes, corazones, retos y tienda.
// Sin DOM ni almacenamiento. Cada función devuelve un estado nuevo.
// Supuestos (confirmar): empieza con 0 corazones perdidos; comprar un corazón
// restaura uno perdido; los puntos pueden no bajar de 0 al penalizar.

export const PUNTOS = {
  metaNormal: 111,
  metaUltimaHora: 77,
  oracion: 333,
  iglesia: 777,
  bonusATiempo: 55,
  perdidaError: 55,
  corazon: 7777,
};

export const STRIKES_POR_CORAZON = 2;
export const CORAZONES_POR_RETO = 3;

export function estadoInicial() {
  return { puntos: 0, strikes: 0, corazonesPerdidos: 0, retosPendientes: 0 };
}

function sumarPuntos(estado, cantidad) {
  return { ...estado, puntos: estado.puntos + cantidad };
}

function registrarStrike(estado) {
  const strikes = estado.strikes + 1;
  if (strikes < STRIKES_POR_CORAZON) return { ...estado, strikes };
  const corazonesPerdidos = estado.corazonesPerdidos + 1;
  const retosNuevos = corazonesPerdidos % CORAZONES_POR_RETO === 0 ? 1 : 0;
  return {
    ...estado,
    strikes: strikes - STRIKES_POR_CORAZON,
    corazonesPerdidos,
    retosPendientes: estado.retosPendientes + retosNuevos,
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
  return Object.fromEntries(CAMPOS_ENTEROS.map((campo) => [campo, datos[campo]]));
}

export function comprarCorazon(estado) {
  if (estado.puntos < PUNTOS.corazon || estado.corazonesPerdidos === 0) return estado;
  return {
    ...estado,
    puntos: estado.puntos - PUNTOS.corazon,
    corazonesPerdidos: estado.corazonesPerdidos - 1,
  };
}
