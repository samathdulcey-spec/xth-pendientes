import { MOBS, PALETA } from './mobs.mjs';

const NS_SVG = 'http://www.w3.org/2000/svg';

// Dibuja un mob de Minecraft en pixel art. Solo usa nombres de MOBS, nunca texto del usuario.
export function crearMob(nombre, tamano = 40) {
  const filas = MOBS[nombre] ?? MOBS.slime;
  const svg = document.createElementNS(NS_SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 8 8');
  svg.setAttribute('width', String(tamano));
  svg.setAttribute('height', String(tamano));
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('aria-hidden', 'true');
  filas.forEach((fila, y) => {
    [...fila].forEach((letra, x) => {
      const color = PALETA[letra];
      if (!color) return;
      const celda = document.createElementNS(NS_SVG, 'rect');
      celda.setAttribute('x', String(x));
      celda.setAttribute('y', String(y));
      celda.setAttribute('width', '1');
      celda.setAttribute('height', '1');
      celda.setAttribute('fill', color);
      svg.append(celda);
    });
  });
  return svg;
}
