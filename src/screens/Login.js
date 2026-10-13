// ¿Qué hace?: Pantalla de inicio de sesión (POST /login). Guarda el token en el celular.
import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { api, guardarToken } from '../api';
import { Boton, Campo, colores, avisar } from '../ui';

export default function Login({ onListo }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  const entrar = async () => {
    setEnviando(true);
    try {
      const r = await api.login(email.trim(), password);
      // La app es solo para padres: cualquier otro rol no tiene acceso
      if (r.user.role !== 'padre') {
        avisar('Acceso restringido', 'Esta app es solo para padres o tutores.');
      } else {
        await guardarToken(r.token);
        onListo();
      }
    } catch (e) {
      avisar('No se pudo entrar', e.message);
    }
    setEnviando(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.fondo}>
      <View style={s.logo}><Text style={{ fontSize: 44 }}>🎓</Text></View>
      <Text style={s.titulo}>Educar</Text>
      <Text style={s.sub}>Para Transformar</Text>
      <View style={s.caja}>
        <Text style={s.hola}>Ingresá a tu cuenta</Text>
        <Campo placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Campo placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />
        <Boton texto={enviando ? 'Entrando...' : 'Iniciar sesión'} onPress={entrar} deshabilitado={enviando || !email || !password} />
        <Text style={s.nota}>Solo para padres o tutores. Si no recordás tu contraseña, pedila a la administración del colegio.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.azul, justifyContent: 'center', padding: 22 },
  logo: { alignSelf: 'center', width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  titulo: { color: '#fff', fontSize: 34, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  sub: { color: '#bfdbfe', textAlign: 'center', marginBottom: 24, fontSize: 15 },
  caja: { backgroundColor: '#fff', borderRadius: 24, padding: 20 },
  hola: { fontSize: 18, fontWeight: '800', color: colores.oscuro, marginBottom: 6 },
  nota: { color: colores.gris, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
