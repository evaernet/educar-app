# Educar - App móvil (Expo)

App para padres/tutores de "Educar Para Transformar". Usa la API Laravel (`/api/v1`).

## Cómo correrla
1. En el backend: `php artisan serve --host=0.0.0.0` (con MySQL prendido en XAMPP).
2. Averiguá la IP de tu PC: `ipconfig` → "Dirección IPv4" (ej. 192.168.0.15).
3. Abrí `src/config.js` y poné esa IP en `API_URL`.
4. En esta carpeta: `npm install` y después `npx expo install --fix` (ajusta versiones).
5. `npx expo start`, escaneá el QR con la app **Expo Go**. El celular y la PC tienen que estar en el mismo WiFi.
   Si el firewall de Windows pregunta por PHP, permitilo en redes privadas.

## Qué tiene (según el TP, Parte 3)
- Login con email de padre/tutor (solo rol padre) y cerrar sesión; cambiar contraseña.
- Lista de hijos con su deuda.
- Por hijo: facturas y comprobantes de pago en un rango de fechas, deuda actual e historial por ítem.
- Detalle de factura: elegir ítems, subir comprobante de transferencia, pagar, ver PDF.

## Estructura
- `App.js`: sesión y navegación simple.
- `src/api.js`: todas las llamadas al backend.
- `src/screens/`: una pantalla por archivo.
