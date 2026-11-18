import { porcentaje, textoProgreso } from './progreso.mjs';

// Dibuja una barra de progreso dentro de `contenedor`.
// Usa textContent y estilos en línea solo con números calculados, nunca HTML de usuario.
export function pintarBarra(contenedor, hechos, total, etiqueta) {
  if (!contenedor) return;
  const valor = porcentaje(hechos, total);

  const barra = document.createElement('div');
  barra.className = 'barra';
  barra.setAttribute('role', 'progressbar');
  barra.setAttribute('aria-label', etiqueta);
  barra.setAttribute('aria-valuemin', '0');
  barra.setAttribute('aria-valuemax', '100');
  barra.setAttribute('aria-valuenow', String(valor));

  const relleno = document.createElement('div');
  relleno.className = 'relleno';
  relleno.style.width = `${valor}%`;
  barra.append(relleno);

  const texto = document.createElement('p');
  texto.className = 'barra-texto';
  texto.textContent = `${etiqueta}: ${textoProgreso(hechos, total)}`;

  contenedor.replaceChildren(barra, texto);
}
