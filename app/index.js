import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import ConsoleScreen from '../features/console/ConsoleScreen';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Mantenemos la pantalla de inicio visible hasta que las fuentes se carguen
SplashScreen.preventAutoHideAsync();

export default function Home() {
    const [fontsLoaded] = useFonts({
        'NauticalFont': require('../assets/fonts/Venus_Rising_Rg.otf'),
    });

    useEffect(() => {
        if (fontsLoaded) SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Cargando fuentes...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ConsoleScreen />
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
