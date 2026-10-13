// ¿Qué hace?: Pantalla de un hijo con 4 pestañas:
//  - Cuotas: facturas en un rango de fechas (pendientes / pagadas / vencimientos / estado)
//  - Deuda: deuda actual e historial discriminado por ítem de pago
//  - Pagos: comprobantes de pago emitidos y transferencias subidas, en un rango de fechas
//  - Servicios: inscripción a deportes, transporte y comedor
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { api, abrirPdf } from '../api';
import { Pantalla, Tarjeta, Boton, Campo, Etiqueta, Titulo, Vacio, Chips, plata, nombrePeriodo, fecha, colores, avisar } from '../ui';

export default function Hijo({ hijo, ir, volver }) {
  const [tab, setTab] = useState('cuotas');
  const tabs = [['cuotas', 'Cuotas'], ['deuda', 'Deuda'], ['pagos', 'Pagos'], ['servicios', 'Servicios']];

  return (
    <Pantalla titulo={hijo.nombre + ' ' + hijo.apellido} subtitulo={'Legajo ' + hijo.legajo} onVolver={volver}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 10, marginTop: 8 }}>
        {tabs.map(([clave, texto]) => (
          <TouchableOpacity key={clave} onPress={() => setTab(clave)}
            style={{ flex: 1, paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: tab === clave ? colores.azul : 'transparent' }}>
            <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 13, color: tab === clave ? colores.azul : colores.gris }}>{texto}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'cuotas' && <Cuotas hijo={hijo} ir={ir} />}
      {tab === 'deuda' && <Deuda hijo={hijo} />}
      {tab === 'pagos' && <Pagos hijo={hijo} />}
      {tab === 'servicios' && <Servicios hijo={hijo} />}
    </Pantalla>
  );
}

// ---- Filtro de fechas con atajos (AAAA-MM-DD) ----
const dosDig = (n) => String(n).padStart(2, '0');
const iso = (d) => d.getFullYear() + '-' + dosDig(d.getMonth() + 1) + '-' + dosDig(d.getDate());

function Fechas({ desde, hasta, setDesde, setHasta, buscar }) {
  const atajo = (clave) => {
    const hoy = new Date();
    let d = '', h = '';
    if (clave === 'mes') { d = iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)); h = iso(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)); }
    if (clave === '3m') { d = iso(new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1)); h = iso(hoy); }
    if (clave === 'anio') { d = hoy.getFullYear() + '-01-01'; h = hoy.getFullYear() + '-12-31'; }
    setDesde(d); setHasta(h);
    buscar(d, h);
  };
  return (
    <Tarjeta>
      <Text style={{ fontWeight: '800', color: colores.oscuro }}>📅 Período</Text>
      <Chips opciones={[['mes', 'Este mes'], ['3m', 'Últimos 3 meses'], ['anio', 'Este año'], ['todo', 'Todo']]} valor={null} onCambio={(c) => atajo(c)} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Campo placeholder="Desde 2026-01-01" value={desde} onChangeText={setDesde} /></View>
        <View style={{ flex: 1 }}><Campo placeholder="Hasta 2026-12-31" value={hasta} onChangeText={setHasta} /></View>
      </View>
      <Boton texto="Buscar" secundario onPress={() => buscar(desde, hasta)} />
    </Tarjeta>
  );
}

function estadoFactura(f) {
  if (f.estado === 'pagada') return ['Pagada', 'ok'];
  if (f.vencida) return ['Vencida', 'mal'];
  return [f.estado === 'parcial' ? 'Pago parcial' : 'Pendiente', 'medio'];
}

function Cuotas({ hijo, ir }) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [lista, setLista] = useState(null);
  const [filtro, setFiltro] = useState('todas');

  const buscar = useCallback(async (d = desde, h = hasta) => {
    try { setLista((await api.facturas(hijo.id, d, h)).facturas); }
    catch (e) { avisar('Error', e.message); setLista([]); }
  }, [hijo.id, desde, hasta]);
  useEffect(() => { buscar(); }, []);

  const visibles = (lista || []).filter((f) => filtro === 'todas' || (filtro === 'pagadas' ? f.estado === 'pagada' : f.estado !== 'pagada'));

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Fechas desde={desde} hasta={hasta} setDesde={setDesde} setHasta={setHasta} buscar={buscar} />
      <Chips opciones={[['todas', 'Todas'], ['pendientes', 'Pendientes'], ['pagadas', 'Pagadas']]} valor={filtro} onCambio={setFiltro} />
      {lista === null ? <Text style={{ textAlign: 'center' }}>Cargando...</Text> : null}
      {lista && visibles.length === 0 ? <Vacio icono="🧾" texto="No hay facturas para mostrar." /> : null}
      {visibles.map((f) => {
        const [txt, tipo] = estadoFactura(f);
        return (
          <Tarjeta key={f.id} onPress={() => ir('factura', { facturaId: f.id })}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: colores.texto }}>{nombrePeriodo(f.periodo)}</Text>
              <Etiqueta texto={txt} tipo={tipo} />
            </View>
            <Text style={{ color: colores.gris, marginTop: 4 }}>Vence el {fecha(f.fecha_vencimiento)}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text>Importe: <Text style={{ fontWeight: '800' }}>{plata(f.total)}</Text></Text>
              {f.estado !== 'pagada' ? <Text style={{ color: colores.rojo, fontWeight: '800' }}>Debe {plata(f.saldo_pendiente)}</Text> : null}
            </View>
          </Tarjeta>
        );
      })}
    </ScrollView>
  );
}

function Deuda({ hijo }) {
  const [datos, setDatos] = useState(null);
  useEffect(() => {
    api.deuda(hijo.id).then(setDatos).catch((e) => { avisar('Error', e.message); setDatos({ deuda_total: 0, historial: [] }); });
  }, []);
  if (!datos) return <Text style={{ padding: 16 }}>Cargando...</Text>;
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Tarjeta style={{ backgroundColor: datos.deuda_total > 0 ? colores.rojo : colores.verde }}>
        <Text style={{ color: '#fff', opacity: 0.85 }}>Deuda actual</Text>
        <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>{plata(datos.deuda_total)}</Text>
      </Tarjeta>
      <Titulo>Historial por ítem de pago</Titulo>
      {datos.historial.length === 0 ? <Vacio icono="✅" texto="Todavía no hay movimientos." /> : null}
      {datos.historial.map((h) => (
        <Tarjeta key={h.item}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '800', flex: 1, color: colores.texto }}>{h.item}</Text>
            <Text style={{ fontWeight: '800', color: h.deuda > 0 ? colores.rojo : colores.verde }}>{h.deuda > 0 ? 'Debe ' + plata(h.deuda) : 'Al día'}</Text>
          </View>
          {h.meses.map((m) => (
            <View key={m.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: colores.gris }}>{nombrePeriodo(m.periodo)}</Text>
              <Text>{plata(m.importe)}</Text>
              <Etiqueta texto={m.pagado ? 'Pagado' : 'Pendiente'} tipo={m.pagado ? 'ok' : 'mal'} />
            </View>
          ))}
        </Tarjeta>
      ))}
    </ScrollView>
  );
}

function Pagos({ hijo }) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [datos, setDatos] = useState(null);

  const buscar = useCallback(async (d = desde, h = hasta) => {
    try { setDatos(await api.comprobantes(hijo.id, d, h)); }
    catch (e) { avisar('Error', e.message); setDatos({ pagos: [], comprobantes_subidos: [] }); }
  }, [hijo.id, desde, hasta]);
  useEffect(() => { buscar(); }, []);

  const ver = (p) => abrirPdf(`/pagos/${p.id}/pdf`, p.numero + '.pdf').catch((e) => avisar('Error', e.message));

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Fechas desde={desde} hasta={hasta} setDesde={setDesde} setHasta={setHasta} buscar={buscar} />
      <Titulo>Comprobantes de pago</Titulo>
      {datos && datos.pagos.length === 0 ? <Vacio icono="🧾" texto="No hay pagos en ese período." /> : null}
      {(datos?.pagos || []).map((p) => (
        <Tarjeta key={p.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '800', color: colores.texto }}>{p.numero}</Text>
            <Text style={{ color: colores.gris }}>{fecha(p.fecha_pago)}</Text>
          </View>
          <Text style={{ color: colores.gris }}>Factura de {nombrePeriodo(p.periodo)}</Text>
          {p.items.map((i, n) => <Text key={n} style={{ marginTop: 3 }}>• {i.descripcion}: {plata(i.importe)}</Text>)}
          <Text style={{ fontWeight: '800', marginTop: 6, color: colores.verde }}>Total pagado {plata(p.total)}</Text>
          <Boton texto="Ver PDF" secundario onPress={() => ver(p)} />
        </Tarjeta>
      ))}
      {datos && datos.comprobantes_subidos.length > 0 ? <Titulo>Transferencias que subiste</Titulo> : null}
      {(datos?.comprobantes_subidos || []).map((c) => (
        <Tarjeta key={c.id}>
          <Text style={{ fontWeight: '700' }}>📎 {c.nombre}</Text>
          <Text style={{ color: colores.gris }}>{fecha(c.fecha)}{c.observacion ? ' · ' + c.observacion : ''}</Text>
        </Tarjeta>
      ))}
    </ScrollView>
  );
}

// Inscripciones del hijo: datos de GET /hijos/{id}
function Servicios({ hijo }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.hijo(hijo.id).then(setD).catch((e) => avisar('Error', e.message)); }, []);
  if (!d) return <Text style={{ padding: 16 }}>Cargando...</Text>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Titulo>🏫 Curso</Titulo>
      <Tarjeta>
        {d.academico.length === 0 ? <Text style={{ color: colores.gris }}>Sin inscripción académica.</Text> : null}
        {d.academico.map((a, i) => <Text key={i}>{a.nivel} · {a.curso} "{a.division}" · Turno {a.turno} ({a.ciclo_lectivo})</Text>)}
      </Tarjeta>

      <Titulo>⚽ Deportes ({d.deportes.length}/2)</Titulo>
      {d.deportes.length === 0 ? <Tarjeta><Text style={{ color: colores.gris }}>No está inscripto a ningún deporte.</Text></Tarjeta> : null}
      {d.deportes.map((dep) => (
        <Tarjeta key={dep.id}>
          <Text style={{ fontWeight: '800', fontSize: 16 }}>{dep.nombre}</Text>
          {dep.horarios.map((h, i) => <Text key={i} style={{ color: colores.gris }}>{h.dia} {String(h.hora_inicio).slice(0, 5)} a {String(h.hora_fin).slice(0, 5)}</Text>)}
        </Tarjeta>
      ))}

      <Titulo>🍽 Comedor</Titulo>
      <Tarjeta>
        {d.comedor
          ? <Text><Text style={{ fontWeight: '800' }}>{d.comedor.turno}</Text> · {String(d.comedor.hora_inicio).slice(0, 5)} a {String(d.comedor.hora_fin).slice(0, 5)}</Text>
          : <Text style={{ color: colores.gris }}>No usa el servicio de comedor.</Text>}
      </Tarjeta>

      <Titulo>🚌 Transporte</Titulo>
      <Tarjeta>
        {d.transporte
          ? <Text><Text style={{ fontWeight: '800' }}>{d.transporte.recorrido}</Text> · {d.transporte.zona}</Text>
          : <Text style={{ color: colores.gris }}>No usa el servicio de transporte.</Text>}
      </Tarjeta>

      <Titulo>📚 Horario de clases</Titulo>
      {d.horarios.length === 0 ? <Tarjeta><Text style={{ color: colores.gris }}>Sin horarios cargados.</Text></Tarjeta> : null}
      {d.horarios.map((h, i) => (
        <Tarjeta key={i}>
          <Text style={{ fontWeight: '700' }}>{h.materia}</Text>
          <Text style={{ color: colores.gris }}>{h.dia} {String(h.hora_inicio).slice(0, 5)} a {String(h.hora_fin).slice(0, 5)} · {h.profesor}</Text>
        </Tarjeta>
      ))}
    </ScrollView>
  );
}
