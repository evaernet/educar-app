// ¿Qué hace?: Todas las llamadas al backend en un solo lugar.
// Guarda el token en el almacenamiento seguro del celular.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { API_URL } from './config';

let token = null;

// En el celular el token va al almacenamiento seguro; en la web (navegador) a localStorage.
export async function cargarToken() {
  token = Platform.OS === 'web' ? window.localStorage.getItem('token') : await SecureStore.getItemAsync('token');
  return token;
}

export async function guardarToken(t) {
  token = t;
  if (Platform.OS === 'web') {
    if (t) window.localStorage.setItem('token', t);
    else window.localStorage.removeItem('token');
    return;
  }
  if (t) await SecureStore.setItemAsync('token', t);
  else await SecureStore.deleteItemAsync('token');
}

// Pedido genérico. "cuerpo" puede ser un objeto (JSON) o un FormData (archivos).
async function pedir(metodo, ruta, cuerpo) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  let body;
  if (cuerpo instanceof FormData) {
    body = cuerpo;
  } else if (cuerpo) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(cuerpo);
  }
  let resp;
  try {
    resp = await fetch(API_URL + ruta, { method: metodo, headers, body });
  } catch (e) {
    throw new Error('No se pudo conectar con el servidor. Revisá la IP en src/config.js y que php artisan serve esté corriendo.');
  }
  const texto = await resp.text();
  let datos = {};
  try { datos = JSON.parse(texto); } catch (e) { /* respuesta sin JSON */ }
  if (!resp.ok) {
    // Laravel manda los errores de validación en "errors"
    const primero = datos.errors ? Object.values(datos.errors)[0][0] : null;
    const err = new Error(primero || datos.message || 'Error ' + resp.status);
    err.status = resp.status;
    throw err;
  }
  return datos;
}

export const api = {
  login: (email, password) => pedir('POST', '/login', { email, password }),
  logout: () => pedir('POST', '/logout'),
  hijos: () => pedir('GET', '/hijos'),
  hijo: (id) => pedir('GET', `/hijos/${id}`),
  facturas: (id, desde, hasta) => pedir('GET', `/hijos/${id}/facturas${rango(desde, hasta)}`),
  comprobantes: (id, desde, hasta) => pedir('GET', `/hijos/${id}/comprobantes${rango(desde, hasta)}`),
  deuda: (id) => pedir('GET', `/hijos/${id}/deuda`),
  factura: (id) => pedir('GET', `/facturas/${id}`),
  subirComprobante: (id, form) => pedir('POST', `/facturas/${id}/comprobantes`, form),
  pagar: (id, items) => pedir('POST', `/facturas/${id}/pagar`, { items }),
  cambiarPassword: (datos) => pedir('POST', '/cambiar-password', datos),
};

function rango(desde, hasta) {
  const p = [];
  if (desde) p.push('desde=' + encodeURIComponent(desde));
  if (hasta) p.push('hasta=' + encodeURIComponent(hasta));
  return p.length ? '?' + p.join('&') : '';
}

// Baja un PDF (factura o comprobante de pago) con el token y abre el menú de compartir/abrir.
export async function abrirPdf(ruta, nombre) {
  // Web: se baja el PDF con el token y se abre en una pestaña nueva
  if (Platform.OS === 'web') {
    const r = await fetch(API_URL + ruta, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/pdf' } });
    if (!r.ok) throw new Error('No se pudo descargar el PDF.');
    const url = URL.createObjectURL(await r.blob());
    window.open(url, '_blank');
    return;
  }
  const destino = FileSystem.cacheDirectory + nombre;
  const r = await FileSystem.downloadAsync(API_URL + ruta, destino, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/pdf' },
  });
  if (r.status !== 200) throw new Error('No se pudo descargar el PDF.');
  await Sharing.shareAsync(r.uri, { mimeType: 'application/pdf' });
}
