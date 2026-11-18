// Convierte el texto de horas libres ("09:00, 14:00") en una lista de horas válidas.
// Las horas inválidas se descartan. Sin DOM, para poder probarlo.

const PATRON_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parsearHoras(texto) {
  if (typeof texto !== 'string') return [];
  return texto
    .split(',')
    .map((hora) => hora.trim())
    .filter((hora) => PATRON_HORA.test(hora));
}
