// ¿Qué hace?: Pantalla principal. Lista los hijos del padre con su deuda y
// muestra un resumen general. Conexión: GET /hijos y GET /hijos/{id}/deuda.
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View, RefreshControl } from 'react-native';
import { api } from '../api';
import { Pantalla, Tarjeta, Boton, Etiqueta, Vacio, plata, colores, avisar } from '../ui';

export default function Hijos({ ir, salir }) {
  const [hijos, setHijos] = useState(null);
  const [recargando, setRecargando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { hijos: lista } = await api.hijos();
      // Por cada hijo traemos la deuda total para mostrarla en su tarjeta
      const conDeuda = await Promise.all(lista.map(async (h) => ({ ...h, deuda: (await api.deuda(h.id)).deuda_total })));
      setHijos(conDeuda);
    } catch (e) {
      avisar('Error', e.message);
      setHijos([]);
    }
  }, []);

  useEffect(() => { cargar(); }, []);

  const total = (hijos || []).reduce((t, h) => t + h.deuda, 0);

  return (
    <Pantalla titulo="Hola 👋" subtitulo="Tus hijos y sus pagos">
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={recargando} onRefresh={async () => { setRecargando(true); await cargar(); setRecargando(false); }} />}>
        <Tarjeta style={{ backgroundColor: total > 0 ? colores.rojo : colores.verde }}>
          <Text style={{ color: '#fff', opacity: 0.85 }}>Deuda total de la familia</Text>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>{plata(total)}</Text>
          <Text style={{ color: '#fff', opacity: 0.85 }}>{total > 0 ? 'Tenés pagos pendientes' : '¡Estás al día!'}</Text>
        </Tarjeta>

        {hijos === null ? <Text style={{ textAlign: 'center', marginTop: 20 }}>Cargando...</Text> : null}
        {hijos && hijos.length === 0 ? <Vacio icono="👨‍👩‍👧" texto="No tenés hijos vinculados. Pedile a la administración que los asocie a tu cuenta." /> : null}

        {(hijos || []).map((h) => (
          <Tarjeta key={h.id} onPress={() => ir('hijo', { hijo: h })}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colores.azulClaro, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colores.azul }}>{h.nombre[0]}{h.apellido[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colores.texto }}>{h.apellido}, {h.nombre}</Text>
                <Text style={{ color: colores.gris }}>Legajo {h.legajo}</Text>
              </View>
              <Text style={{ fontSize: 22, color: colores.gris }}>›</Text>
            </View>
            <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Etiqueta texto={h.deuda > 0 ? 'Con deuda' : 'Al día'} tipo={h.deuda > 0 ? 'mal' : 'ok'} />
              <Text style={{ fontWeight: '800', color: h.deuda > 0 ? colores.rojo : colores.verde }}>{plata(h.deuda)}</Text>
            </View>
          </Tarjeta>
        ))}

        <Boton texto="🔑  Cambiar contraseña" secundario onPress={() => ir('password')} />
        <Boton texto="Cerrar sesión" peligro onPress={salir} />
      </ScrollView>
    </Pantalla>
  );
}
