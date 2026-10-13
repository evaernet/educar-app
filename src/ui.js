// ¿Qué hace?: Piezas visuales reutilizables (colores, cabecera, botones, tarjetas, etiquetas).
// Todo el estilo de la app vive acá para que sea fácil cambiarlo.
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, Platform } from 'react-native';

export const colores = {
  azul: '#1e5aa8', oscuro: '#12315c', turquesa: '#14b8a6', fondo: '#eef3f9',
  texto: '#0f172a', gris: '#64748b', borde: '#dbe4ef',
  rojo: '#dc2626', rojoClaro: '#fee2e2', verde: '#16a34a', verdeClaro: '#dcfce7',
  naranja: '#d97706', naranjaClaro: '#fef3c7', azulClaro: '#dbeafe',
};

const sombra = { shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 };

// Cabecera azul con esquinas redondeadas abajo
export function Pantalla({ titulo, subtitulo, onVolver, derecha, children }) {
  return (
    <View style={s.pantalla}>
      <View style={s.barra}>
        <View style={s.barraFila}>
          {onVolver ? <TouchableOpacity onPress={onVolver} style={s.volver}><Text style={s.volverTxt}>‹</Text></TouchableOpacity> : null}
          <View style={{ flex: 1 }}>
            <Text style={s.titulo} numberOfLines={1}>{titulo}</Text>
            {subtitulo ? <Text style={s.subtitulo}>{subtitulo}</Text> : null}
          </View>
          {derecha}
        </View>
      </View>
      {children}
    </View>
  );
}

export function Boton({ texto, onPress, secundario, peligro, deshabilitado }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={deshabilitado}
      activeOpacity={0.8}
      style={[s.boton, secundario && s.botonSec, peligro && s.botonPeligro, deshabilitado && { opacity: 0.45 }]}>
      <Text style={[s.botonTxt, secundario && { color: colores.azul }, peligro && { color: colores.rojo }]}>{texto}</Text>
    </TouchableOpacity>
  );
}

export function Campo(props) {
  return <TextInput placeholderTextColor="#94a3b8" autoCapitalize="none" {...props} style={[s.campo, props.style]} />;
}

export function Tarjeta({ children, onPress, style }) {
  const Cont = onPress ? TouchableOpacity : View;
  return <Cont onPress={onPress} activeOpacity={0.85} style={[s.tarjeta, style]}>{children}</Cont>;
}

// Etiqueta de color (estado de una factura o de un ítem)
export function Etiqueta({ texto, tipo }) {
  const mapa = {
    ok: [colores.verdeClaro, colores.verde], mal: [colores.rojoClaro, colores.rojo],
    medio: [colores.naranjaClaro, colores.naranja], info: [colores.azulClaro, colores.azul],
  };
  const [fondo, color] = mapa[tipo] || mapa.info;
  return <View style={[s.etiqueta, { backgroundColor: fondo }]}><Text style={[s.etiquetaTxt, { color }]}>{texto}</Text></View>;
}

export function Titulo({ children }) {
  return <Text style={s.seccion}>{children}</Text>;
}

export function Vacio({ icono, texto }) {
  return (
    <View style={{ alignItems: 'center', padding: 30 }}>
      <Text style={{ fontSize: 40 }}>{icono}</Text>
      <Text style={{ color: colores.gris, textAlign: 'center', marginTop: 6 }}>{texto}</Text>
    </View>
  );
}

// Botoncitos para elegir una opción (filtros)
export function Chips({ opciones, valor, onCambio }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 }}>
      {opciones.map(([clave, texto]) => (
        <TouchableOpacity key={clave} onPress={() => onCambio(clave)} style={[s.chip, valor === clave && s.chipOn]}>
          <Text style={{ color: valor === clave ? '#fff' : colores.azul, fontWeight: '600', fontSize: 13 }}>{texto}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Aviso que funciona en celular (Alert) y en la versión web (window.alert),
// porque Alert.alert no hace nada en el navegador.
export function avisar(titulo, mensaje) {
  if (Platform.OS === 'web') window.alert(titulo + (mensaje ? '\n\n' + mensaje : ''));
  else Alert.alert(titulo, mensaje);
}

export const plata = (n) => '$' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Convierte "2026-11" en "Noviembre 2026"
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const nombrePeriodo = (p) => { const [a, m] = String(p).split('-'); return (MESES[Number(m) - 1] || p) + ' ' + a; };

// "2026-11-20" -> "20/11/2026"
export const fecha = (f) => (f ? String(f).slice(0, 10).split('-').reverse().join('/') : '');

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  barra: { backgroundColor: colores.azul, paddingTop: 50, paddingBottom: 18, paddingHorizontal: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  barraFila: { flexDirection: 'row', alignItems: 'center' },
  volver: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  volverTxt: { color: '#fff', fontSize: 26, marginTop: -3 },
  titulo: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitulo: { color: '#bfdbfe', fontSize: 13, marginTop: 2 },
  boton: { backgroundColor: colores.azul, borderRadius: 14, padding: 14, alignItems: 'center', marginVertical: 6, ...sombra },
  botonSec: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colores.azul, shadowOpacity: 0, elevation: 0 },
  botonPeligro: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colores.rojo, shadowOpacity: 0, elevation: 0 },
  botonTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  campo: { backgroundColor: '#fff', borderWidth: 1, borderColor: colores.borde, borderRadius: 14, padding: 13, marginVertical: 6, fontSize: 15, color: colores.texto },
  tarjeta: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginVertical: 7, ...sombra },
  etiqueta: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  etiquetaTxt: { fontSize: 12, fontWeight: '700' },
  seccion: { fontSize: 16, fontWeight: '800', color: colores.oscuro, marginTop: 14, marginBottom: 2 },
  chip: { borderWidth: 1.5, borderColor: colores.azul, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff' },
  chipOn: { backgroundColor: colores.azul },
});
