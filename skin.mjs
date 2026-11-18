// Skin de Minecraft de frente (16x32). La cabeza (8x8) sale de la foto del usuario;
// el cuerpo usa colores base que se pueden cambiar. Sin DOM, para poder probarlo.

export const ANCHO = 16;
export const ALTO = 32;

export const COLORES_CUERPO = {
  camisa: '#1c1c1c',
  piel: '#e0b48f',
  pantalon: '#2b3a67',
  zapatos: '#f2f2f2',
};

function tono(color, desplazamiento) {
  const rgb = color.match(/\d+/g)?.slice(0, 3).map(Number) ?? [224, 180, 143];
  return `rgb(${rgb.map((canal) => Math.max(0, Math.min(255, canal + desplazamiento))).join(',')})`;
}

// Rostro frontal 8x8 inspirado en la foto: tono de piel muestreado, pelo morado,
// gorra oscura con parches, cejas y ojos de alto contraste.
export function generarCaraMinecraft(piel = 'rgb(224,180,143)', pelo = 'rgb(89,49,123)') {
  const cara = Array.from({ length: 8 }, () => Array(8).fill(null));
  const dibujar = (y, desde, hasta, color) => {
    for (let x = desde; x <= hasta; x += 1) cara[y][x] = color;
  };
  const sombraPiel = tono(piel, -26);
  const luzPiel = tono(piel, 18);
  const sombraPelo = tono(pelo, -24);
  const gorra = '#17151b';
  dibujar(0, 2, 5, gorra);
  dibujar(1, 1, 6, gorra);
  dibujar(2, 0, 7, gorra);
  cara[1][2] = '#4b8a46'; cara[1][3] = '#d5ddd0';
  cara[1][5] = '#dc8b43'; cara[1][6] = '#f0d6a1';
  cara[2][1] = '#27242c'; cara[2][6] = '#29262e';
  for (let y = 3; y < 8; y += 1) {
    cara[y][0] = sombraPelo;
    cara[y][7] = sombraPelo;
    dibujar(y, 1, 6, piel);
  }
  cara[3][1] = sombraPelo; cara[3][6] = sombraPelo;
  cara[4][1] = sombraPiel; cara[4][6] = sombraPiel;
  cara[4][2] = sombraPelo; cara[4][5] = sombraPelo;
  cara[5][2] = '#f1eee5'; cara[5][3] = '#29232c';
  cara[5][4] = '#29232c'; cara[5][5] = '#f1eee5';
  cara[6][2] = piel; cara[6][3] = sombraPiel; cara[6][4] = sombraPiel; cara[6][5] = piel;
  cara[7][2] = sombraPiel; cara[7][3] = luzPiel; cara[7][4] = luzPiel; cara[7][5] = sombraPiel;
  return cara;
}

// cabeza: 8 filas de 8 colores. Devuelve una cuadrícula ALTO x ANCHO de colores (null = vacío).
export function construirSkin(cabeza, cuerpo = COLORES_CUERPO) {
  const celdas = Array.from({ length: ALTO }, () => Array(ANCHO).fill(null));
  const pintar = (x0, y0, ancho, alto, color) => {
    for (let y = y0; y < y0 + alto; y += 1) {
      for (let x = x0; x < x0 + ancho; x += 1) celdas[y][x] = color;
    }
  };
  cabeza.forEach((fila, y) => fila.forEach((color, x) => { celdas[y][x + 4] = color; }));
  pintar(4, 8, 8, 12, cuerpo.camisa);
  pintar(0, 8, 4, 12, cuerpo.camisa);
  pintar(12, 8, 4, 12, cuerpo.camisa);
  pintar(0, 17, 4, 3, cuerpo.piel);
  pintar(12, 17, 4, 3, cuerpo.piel);
  pintar(4, 20, 4, 12, cuerpo.pantalon);
  pintar(8, 20, 4, 12, cuerpo.pantalon);
  pintar(4, 29, 4, 3, cuerpo.zapatos);
  pintar(8, 29, 4, 3, cuerpo.zapatos);
  return celdas;
}
