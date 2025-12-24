import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { GAUGE_THEME } from '../styles/GaugeTheme';

const NavigationMode = React.memo(({ mode = 'sail' }) => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    // CORRECCIÓN: Definir como un objeto con valores numéricos reales
    const width = windowWidth * 0.9;
    const height = windowHeight * 0.05;

    const isSail = mode.toLowerCase() === 'sail';
    const accentColor = isSail ? "#00E5FF" : GAUGE_THEME.colors.engine;

    return (
        // Usamos las variables directas para evitar undefined
        <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <Defs>
                    <LinearGradient id="bezelOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#999" />
                        <Stop offset="100%" stopColor="#333" />
                    </LinearGradient>
                </Defs>

                {/* --- MARCO --- */}
                {/* Ajustamos x e y a 1 para que el stroke de 2 se vea perfectamente dentro */}
                <Rect
                    x="1"
                    y="1"
                    width={width - 2}
                    height={height - 2}
                    rx={10}
                    fill={GAUGE_THEME.colors.bg}
                    stroke="url(#bezelOuter)"
                    strokeWidth="2"
                />
            </Svg>

            {/* --- CONTENIDO DE TEXTO --- */}
            <View style={styles.overlay}>
                <View style={styles.centerInfo}>
                    <Text style={[styles.modeName, { color: accentColor, fontSize: height * 0.4 }]}>
                        {isSail ? 'SAIL' : 'ENGINE'} MODE
                    </Text>
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        // Eliminamos el padding excesivo para que en alturas pequeñas (10%) no oculte el texto
        justifyContent: 'center',
        alignItems: 'center'
    },
    centerInfo: {
        alignItems: 'center',
    },
    modeName: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'NauticalFont',
        letterSpacing: 1
    }
});

export default NavigationMode;