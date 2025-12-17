// app/index.js

import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import SignalKConnector from '../SignalKConnector';
// Importamos los hooks de Expo para manejar la carga de fuentes
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen'; // Para controlar la pantalla de inicio

// Mantenemos la pantalla de inicio visible hasta que las fuentes se carguen
SplashScreen.preventAutoHideAsync();

export default function Home() {
    // Define la fuente y su ruta de carga
    const [fontsLoaded] = useFonts({
        // 'NauticalFont' es el nombre que usarás en el CSS (styles)
        'NauticalFont': require('../assets/fonts/Venus_Rising_Rg.otf'),
        // Asegúrate de reemplazar 'nautical-mono.ttf' con el nombre de tu archivo real
    });

    // 1. Mostrar pantalla de inicio o carga mientras se cargan las fuentes
    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Cargando fuentes...</Text>
            </View>
        );
    }

    // 2. Ocultar la pantalla de inicio una vez que las fuentes están cargadas
    SplashScreen.hideAsync();

    return (
        <SafeAreaView style={styles.container}>
            {/* Tu componente principal */}
            <SignalKConnector />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});