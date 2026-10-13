// ¿Qué hace?: Cambiar la contraseña (POST /cambiar-password).
import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { api } from '../api';
import { Pantalla, Tarjeta, Boton, Campo, colores, avisar } from '../ui';

export default function CambiarPassword({ volver }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');

  const guardar = async () => {
    try {
      await api.cambiarPassword({ password_actual: actual, password: nueva, password_confirmation: repetir });
      avisar('Listo', 'Contraseña actualizada.');
      volver();
    } catch (e) { avisar('No se pudo cambiar', e.message); }
  };

  return (
    <Pantalla titulo="Cambiar contraseña" onVolver={volver}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Tarjeta>
          <Campo placeholder="Contraseña actual" secureTextEntry value={actual} onChangeText={setActual} />
          <Campo placeholder="Contraseña nueva" secureTextEntry value={nueva} onChangeText={setNueva} />
          <Campo placeholder="Repetir contraseña nueva" secureTextEntry value={repetir} onChangeText={setRepetir} />
          <Text style={{ color: colores.gris, fontSize: 12 }}>Mínimo 8 caracteres, con mayúsculas, minúsculas y números.</Text>
          <Boton texto="Guardar" onPress={guardar} deshabilitado={!actual || !nueva || !repetir} />
        </Tarjeta>
      </ScrollView>
    </Pantalla>
  );
}
