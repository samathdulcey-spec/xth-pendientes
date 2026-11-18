// Reglas del juego de metas. Son valores de configuración, no lógica.
//
// Supuestos por confirmar con Samath (2026-11-18):
// - La partida empieza sin corazones perdidos.
// - Comprar un corazón restaura uno perdido.
// - Los puntos pueden bajar de 0 por penalizaciones.
// - El bonus de 55 aplica solo a metas hechas a tiempo.

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
