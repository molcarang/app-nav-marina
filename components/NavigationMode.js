import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop, G, Path as SvgPath } from 'react-native-svg';
import { GAUGE_THEME } from '../styles/GaugeTheme';

const NavigationMode = React.memo(({ mode = 'sail', width = 150, height = 50 }) => {
    const isSail = mode.toLowerCase() === 'sail';

    // Colores y Paths de los iconos
    const iconColor = isSail ? "#00E5FF" : "#FF9100";
    const modeDescription = isSail ? "Optimal for wind propulsion" : "Engine engaged for propulsion";

    // SVG Path para el icono de Vela (simplificado)
    const sailIconPath = "M12 2L6 15H18L12 2Z M12 18V22"; 
    // SVG Path para el icono de Motor (simplificado, como una hélice)
    const engineIconPath = "M12 2C7.58 2 4 5.58 4 10C4 14.42 7.58 18 12 18C16.42 18 20 14.42 20 10C20 5.58 16.42 2 12 2ZM12 16C8.68 16 6 13.32 6 10C6 6.68 8.68 4 12 4C15.32 4 18 6.68 18 10C18 13.32 15.32 16 12 16Z M12 7V13 M9 10H15";

    return (
        <View style={[styles.container, { width, height }]}>
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <Defs>
                    {/* Gradientes para el marco metálico */}
                    <LinearGradient id="bezelOuterNav" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#888" stopOpacity="1" />
                        <Stop offset="50%" stopColor="#eee" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#444" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="bezelInnerNav" x1="100%" y1="100%" x2="0%" y2="0%">
                        <Stop offset="0%" stopColor="#666" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#222" stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                {/* --- CAPA 1: MARCO METÁLICO SVG --- */}
                <G>
                    {/* Fondo del cuadro */}
                    <Rect
                        x="0" y="0"
                        width={width} height={height}
                        rx={10}
                        fill={GAUGE_THEME.colors.bg}
                    />
                    {/* Anillo Exterior Fino */}
                    <Rect
                        x="2" y="2"
                        width={width - 4} height={height - 4}
                        rx={8}
                        fill="none"
                        stroke="url(#bezelOuterNav)"
                        strokeWidth="2.5" // Grosor más fino
                    />
                    {/* Línea de contraste interior */}
                    <Rect
                        x="4" y="4"
                        width={width - 8} height={height - 8}
                        rx={6}
                        fill="none"
                        stroke="url(#bezelInnerNav)"
                        strokeWidth="1"
                    />
                </G>
            </Svg>

            {/* --- CAPA 3: TEXTOS (Superpuestos para facilitar el layout) --- */}
            <View style={styles.textOverlay}>
                <Text style={[styles.modeText, { color: iconColor }]}>
                    {isSail ? 'SAIL MODE' : 'ENGINE MODE'}
                </Text>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        backgroundColor: 'transparent',
    },
    textOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    title: {
        fontSize: 12,
        color: '#AAA',
        fontWeight: 'bold',
        letterSpacing: 1,
        marginTop: 5,
    },
    modeText: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'NauticalFont', // Asumiendo que 'NauticalFont' está cargada
        marginBottom: 2,
    },
    descriptionText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        flexWrap: 'wrap', // Para que el texto largo se ajuste
        lineHeight: 14,
    },
});

export default NavigationMode;