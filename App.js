// ¿Qué hace?: Punto de entrada de la app. Maneja la sesión (token) y una pila
// simple de pantallas, sin librerías de navegación para que sea fácil de entender.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { api, cargarToken, guardarToken } from './src/api';
import Login from './src/screens/Login';
import Hijos from './src/screens/Hijos';
import Hijo from './src/screens/Hijo';
import FacturaDetalle from './src/screens/FacturaDetalle';
import CambiarPassword from './src/screens/CambiarPassword';

export default function App() {
  const [cargando, setCargando] = useState(true);
  const [logueado, setLogueado] = useState(false);
  const [pila, setPila] = useState([{ nombre: 'hijos' }]);

  // Al abrir la app: si hay un token guardado, entra directo
  useEffect(() => {
    cargarToken().then((t) => { setLogueado(!!t); setCargando(false); });
  }, []);

  const ir = (nombre, params = {}) => setPila((p) => [...p, { nombre, ...params }]);
  const volver = () => setPila((p) => (p.length > 1 ? p.slice(0, -1) : p));

  const salir = async () => {
    try { await api.logout(); } catch (e) { /* si falla igual cerramos local */ }
    await guardarToken(null);
    setPila([{ nombre: 'hijos' }]);
    setLogueado(false);
  };

  if (cargando) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  if (!logueado) return <><StatusBar style="light" /><Login onListo={() => setLogueado(true)} /></>;

  const actual = pila[pila.length - 1];
  let pantalla = null;
  if (actual.nombre === 'hijos') pantalla = <Hijos ir={ir} salir={salir} />;
  if (actual.nombre === 'hijo') pantalla = <Hijo hijo={actual.hijo} ir={ir} volver={volver} />;
  if (actual.nombre === 'factura') pantalla = <FacturaDetalle facturaId={actual.facturaId} volver={volver} />;
  if (actual.nombre === 'password') pantalla = <CambiarPassword volver={volver} />;

  return <><StatusBar style="light" />{pantalla}</>;
}
