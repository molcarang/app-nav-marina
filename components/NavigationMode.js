import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { GAUGE_THEME } from '../styles/GaugeTheme';

const NavigationMode = React.memo(({ isSail }) => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const isLandscape = windowWidth > windowHeight;
    const navWidth = isLandscape ? windowWidth * 0.7 : windowWidth * 0.9;
    const navHeight = isLandscape ? windowHeight * 0.12 : windowHeight * 0.08;

    const accentColor = isSail ? GAUGE_THEME.colors.sail : GAUGE_THEME.colors.engine;

    const calculatedFontSize = Math.round(navHeight * 0.3);
    const fontSize = Math.min(Math.max(calculatedFontSize, 14), 40);

    return (
        <View style={{ width: navWidth, height: navHeight, alignSelf: 'center', marginVertical: 10 }}>
            <Svg width={navWidth} height={navHeight} viewBox={`0 0 ${navWidth} ${navHeight}`}>
                <Defs>
                    {/* Gradiente para emular el brillo del anillo interior del SOGGauge */}
                    <LinearGradient id="innerRingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
                        <Stop offset="50%" stopColor={accentColor} stopOpacity="1" />
                        <Stop offset="100%" stopColor={accentColor} stopOpacity="0.6" />
                    </LinearGradient>

                    {/* Gradiente metálico exterior sutil para el bisel fino */}
                    <LinearGradient id="thinBezel" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#888" />
                        <Stop offset="100%" stopColor="#222" />
                    </LinearGradient>
                </Defs>

                {/* --- MARCO EXTERIOR (Bisel Mecanizado Fino) --- */}
                <Rect
                    x="1" y="1"
                    width={navWidth - 2}
                    height={navHeight - 2}
                    rx={12}
                    fill={GAUGE_THEME.colors.bg}
                    stroke="url(#thinBezel)"
                    strokeWidth="1"
                />

                {/* --- EL ANILLO "SOGGAUGE STYLE" --- */}
                {/* Este es el que emula el aro interior de color de tus instrumentos */}
                <Rect
                    x="3" y="3"
                    width={navWidth - 6}
                    height={navHeight - 6}
                    rx={10}
                    fill="none"
                    stroke="url(#innerRingGradient)"
                    strokeWidth="3" // Un poco más grueso para que destaque el color
                />

                {/* Brillo interior extra (opcional, para dar efecto 3D) */}
                <Rect
                    x="5" y="5"
                    width={navWidth - 10}
                    height={navHeight - 10}
                    rx={9}
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                    strokeOpacity="0.2"
                />
            </Svg>

            {/* --- CONTENIDO --- */}
            <View style={styles.overlay}>
                <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[styles.modeName, {
                        color: accentColor,
                        fontSize: fontSize,
                        width: '80%'
                    }]}
                >
                    {isSail ? 'SAILING' : 'ENGINE'} MODE
                </Text>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modeName: {
        fontWeight: 'bold',
        fontFamily: 'NauticalFont',
        letterSpacing: 3,
        textAlign: 'center',
        // Efecto de resplandor en el texto coordinado con el anillo
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3
    }
});

export default NavigationMode;