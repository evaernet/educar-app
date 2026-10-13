// ¿Qué hace?: Detalle de una factura. Permite:
//  1) ver el PDF de la factura
//  2) subir uno o más comprobantes de transferencia (una factura puede tener varios)
//  3) elegir qué ítems pagar y registrar el pago -> el sistema emite el comprobante de pago
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { api, abrirPdf } from '../api';
import { Pantalla, Tarjeta, Boton, Etiqueta, Titulo, plata, nombrePeriodo, fecha, colores, avisar } from '../ui';

export default function FacturaDetalle({ facturaId, volver }) {
  const [f, setF] = useState(null);
  const [elegidos, setElegidos] = useState([]);
  const [ocupado, setOcupado] = useState(false);

  const cargar = async () => {
    try { setF((await api.factura(facturaId)).factura); setElegidos([]); }
    catch (e) { avisar('Error', e.message); }
  };
  useEffect(() => { cargar(); }, []);

  if (!f) return <Pantalla titulo="Factura" onVolver={volver}><Text style={{ padding: 16 }}>Cargando...</Text></Pantalla>;

  const alternar = (id) => setElegidos((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));
  const pendientes = f.items.filter((i) => !i.pagado);
  const totalElegido = f.items.filter((i) => elegidos.includes(i.id)).reduce((t, i) => t + i.importe, 0);
  const todosMarcados = pendientes.length > 0 && elegidos.length === pendientes.length;

  const subir = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    if (r.canceled) return;
    const a = r.assets[0];
    const form = new FormData();
    if (Platform.OS === 'web') {
      // En el navegador el archivo se manda como Blob
      form.append('archivo', a.file || (await (await fetch(a.uri)).blob()), a.name || 'comprobante');
    } else {
      form.append('archivo', { uri: a.uri, name: a.name || 'comprobante', type: a.mimeType || 'application/octet-stream' });
    }
    setOcupado(true);
    try { await api.subirComprobante(f.id, form); avisar('Listo', 'Comprobante subido.'); await cargar(); }
    catch (e) { avisar('No se pudo subir', e.message); }
    setOcupado(false);
  };

  const pagar = async () => {
    setOcupado(true);
    try {
      const r = await api.pagar(f.id, elegidos);
      avisar('Pago registrado ✅', 'Se emitió el comprobante ' + r.pago.numero + ' por ' + plata(r.pago.total));
      await cargar();
    } catch (e) { avisar('No se pudo pagar', e.message); }
    setOcupado(false);
  };

  const estado = f.estado === 'pagada' ? ['Pagada', 'ok'] : f.vencida ? ['Vencida', 'mal'] : [f.estado === 'parcial' ? 'Pago parcial' : 'Pendiente', 'medio'];

  return (
    <Pantalla titulo={nombrePeriodo(f.periodo)} subtitulo={'Vence el ' + fecha(f.fecha_vencimiento)} onVolver={volver}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Tarjeta>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colores.gris }}>Importe total</Text>
            <Etiqueta texto={estado[0]} tipo={estado[1]} />
          </View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colores.texto }}>{plata(f.total)}</Text>
          <Text style={{ color: f.saldo_pendiente > 0 ? colores.rojo : colores.verde, fontWeight: '700' }}>
            {f.saldo_pendiente > 0 ? 'Saldo pendiente ' + plata(f.saldo_pendiente) : 'Sin saldo pendiente'}
          </Text>
          <Text style={{ color: colores.gris, marginTop: 4 }}>Emitida el {fecha(f.fecha_emision)}</Text>
        </Tarjeta>

        <Titulo>Ítems de la factura</Titulo>
        {pendientes.length > 1 ? (
          <TouchableOpacity onPress={() => setElegidos(todosMarcados ? [] : pendientes.map((i) => i.id))}>
            <Text style={{ color: colores.azul, fontWeight: '700', marginVertical: 4 }}>{todosMarcados ? 'Quitar selección' : 'Seleccionar todos los pendientes'}</Text>
          </TouchableOpacity>
        ) : null}
        {f.items.map((i) => {
          const marcado = elegidos.includes(i.id);
          return (
            <TouchableOpacity key={i.id} disabled={i.pagado} onPress={() => alternar(i.id)} activeOpacity={0.8}
              style={{ backgroundColor: marcado ? colores.azulClaro : '#fff', borderRadius: 16, padding: 14, marginVertical: 5, borderWidth: marcado ? 2 : 1, borderColor: marcado ? colores.azul : colores.borde, opacity: i.pagado ? 0.7 : 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: 10 }}>{i.pagado ? '✅' : marcado ? '☑️' : '⬜'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colores.texto }}>{i.descripcion}</Text>
                  {i.pagado ? <Text style={{ color: colores.verde, fontSize: 12 }}>Pagado el {fecha(i.pagado_el)}</Text> : null}
                </View>
                <Text style={{ fontWeight: '800' }}>{plata(i.importe)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {f.saldo_pendiente > 0 ? (
          <>
            <Titulo>Cómo pagar</Titulo>
            <Tarjeta style={{ backgroundColor: colores.naranjaClaro }}>
              <Text style={{ color: '#92400e' }}>
                Los pagos son solo por transferencia bancaria (no se acepta efectivo). 1) Hacé la transferencia, 2) subí el comprobante, 3) marcá los ítems y tocá Pagar.
              </Text>
            </Tarjeta>
            <Boton texto={'📎  Subir comprobante de transferencia (' + f.comprobantes.length + ')'} secundario onPress={subir} deshabilitado={ocupado} />
            <Boton texto={'Pagar seleccionados · ' + plata(totalElegido)} onPress={pagar} deshabilitado={ocupado || elegidos.length === 0} />
          </>
        ) : null}

        {f.comprobantes.length > 0 ? (
          <>
            <Titulo>Comprobantes subidos</Titulo>
            {f.comprobantes.map((c) => <Tarjeta key={c.id}><Text>📎 {c.nombre}</Text></Tarjeta>)}
            {f.saldo_pendiente === 0 ? <Boton texto="📎  Subir otro comprobante" secundario onPress={subir} deshabilitado={ocupado} /> : null}
          </>
        ) : null}

        <Boton texto="📄  Ver factura en PDF" secundario onPress={() => abrirPdf(`/facturas/${f.id}/pdf`, `factura-${f.periodo}.pdf`).catch((e) => avisar('Error', e.message))} />
      </ScrollView>
    </Pantalla>
  );
}
