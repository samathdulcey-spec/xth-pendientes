// Avatar: tu foto se convierte en la cabeza de una skin de Minecraft de cuerpo completo.
// Se guarda solo en este navegador. No se publica ni se sube a ningún servicio.

import { ALTO, ANCHO, construirSkin, generarCaraMinecraft } from './skin.mjs';

const CLAVE_AVATAR = 'xth.avatar.v2';
const AVATAR_PREDETERMINADO = 'avatar.jpg';
const ESCALA = 8;

function leerAvatar() {
  try {
    return localStorage.getItem(CLAVE_AVATAR);
  } catch (err) {
    console.warn('No se pudo leer el avatar:', err);
    return null;
  }
}

function guardarAvatar(dataUrl) {
  try {
    localStorage.setItem(CLAVE_AVATAR, dataUrl);
  } catch (err) {
    console.warn('No se pudo guardar el avatar:', err);
  }
}

function cargarImagen(fuente) {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onerror = () => rechazar(new Error('La imagen no se pudo abrir'));
    imagen.onload = () => resolver(imagen);
    imagen.src = fuente;
  });
}

function leerArchivo(archivo) {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onerror = () => rechazar(lector.error);
    lector.onload = () => resolver(lector.result);
    lector.readAsDataURL(archivo);
  });
}

// Reduce la foto a 256 px de lado para que quepa en el almacenamiento del navegador.
function reducir(imagen) {
  const lado = Math.min(imagen.naturalWidth, imagen.naturalHeight);
  const lienzo = document.createElement('canvas');
  lienzo.width = 256;
  lienzo.height = 256;
  lienzo
    .getContext('2d')
    .drawImage(imagen, (imagen.naturalWidth - lado) / 2, (imagen.naturalHeight - lado) / 2, lado, lado, 0, 0, 256, 256);
  return lienzo.toDataURL('image/jpeg', 0.85);
}

// Muestrea un tono real de piel de la foto; el rostro de 8x8 se redibuja como pixel art.
function muestrearColor(imagen, x, y) {
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 1;
  const contexto = lienzo.getContext('2d', { willReadFrequently: true });
  const centroX = Math.round(x * imagen.naturalWidth);
  const centroY = Math.round(y * imagen.naturalHeight);
  contexto.drawImage(imagen, centroX - 3, centroY - 3, 7, 7, 0, 0, 1, 1);
  const [rojo, verde, azul] = contexto.getImageData(0, 0, 1, 1).data;
  return `rgb(${rojo},${verde},${azul})`;
}

function dibujarSkin(celdas) {
  const lienzo = document.createElement('canvas');
  lienzo.width = ANCHO * ESCALA;
  lienzo.height = ALTO * ESCALA;
  lienzo.className = 'skin-cuerpo';
  lienzo.setAttribute('role', 'img');
  lienzo.setAttribute('aria-label', 'Tu avatar de Minecraft');
  const contexto = lienzo.getContext('2d');
  celdas.forEach((fila, y) =>
    fila.forEach((color, x) => {
      if (!color) return;
      contexto.fillStyle = color;
      contexto.fillRect(x * ESCALA, y * ESCALA, ESCALA, ESCALA);
    }),
  );
  return lienzo;
}

export function iniciarAvatar() {
  const contenedor = document.getElementById('avatar');
  if (!contenedor) return;

  async function pintar() {
    const guardado = leerAvatar();
    let skin = null;
    try {
      const imagen = await cargarImagen(guardado ?? AVATAR_PREDETERMINADO);
      const tonoPiel = muestrearColor(imagen, guardado ? 0.48 : 0.36, guardado ? 0.55 : 0.58);
      skin = dibujarSkin(construirSkin(generarCaraMinecraft(tonoPiel)));
    } catch (err) {
      console.warn('No se pudo armar la skin:', err);
    }

    const marco = document.createElement('div');
    marco.className = 'skin-marco';
    if (skin) marco.append(skin);
    else marco.textContent = '?';

    const etiqueta = document.createElement('label');
    etiqueta.className = 'boton-subir';
    etiqueta.textContent = 'Cambiar foto';
    const entrada = document.createElement('input');
    entrada.type = 'file';
    entrada.accept = 'image/*';
    entrada.hidden = true;
    entrada.addEventListener('change', async () => {
      const archivo = entrada.files?.[0];
      if (!archivo) return;
      try {
        const imagen = await cargarImagen(await leerArchivo(archivo));
        guardarAvatar(reducir(imagen));
        pintar();
      } catch (err) {
        console.warn('No se pudo usar la foto:', err);
      }
    });
    etiqueta.append(entrada);

    contenedor.replaceChildren(marco, etiqueta);
  }

  pintar();
}
