// Reglas del juego de metas. Son valores de configuración, no lógica.
//
// El bonus de 55 aplica a objetivos completados a tiempo.

export const PUNTOS = {
  metaNormal: 111,
  metaUltimaHora: 77,
  oracion: 333,
  iglesia: 777,
  bonusATiempo: 55,
  perdidaError: 55,
};

export const STRIKES_POR_PARTIDA = 3;
export const VIDAS_TOTALES = 3;
export const META_MENSUAL = 1_000_000;

// Premios de la tienda. Mezcla valor de Minecraft y valor real.
// Precios propuestos por Claude: confirmar o cambiar.
export const PREMIOS = [
  { id: 'descanso', nombre: 'Día de descanso (Tótem dorado)', precio: 2222 },
  { id: 'granizado', nombre: 'Paseo y granizado (Manzana dorada)', precio: 555 },
  { id: 'comida', nombre: 'Comida rápida (Pastel)', precio: 777 },
  { id: 'paseo-largo', nombre: 'Paseo largo (Elytra)', precio: 3333 },
  { id: 'camisa', nombre: 'Camisa (Diamante)', precio: 4444 },
  { id: 'pantalones', nombre: 'Pantalones (Armadura de hierro)', precio: 5555 },
  { id: 'zapatos', nombre: 'Zapatos (Botas de netherita)', precio: 7777 },
];
