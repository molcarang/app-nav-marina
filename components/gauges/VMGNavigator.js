import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { GaugeDefs } from './shared/GaugeDefs';

const VMGNavigator = ({ vmg = 0, targetVMG = 6.5, size = 180 }) => {
    // --- CONFIGURACIÓN DE DIMENSIONES SEGÚN TU PATRÓN ---
    const BEZEL_SIZE = size * 0.12; // Proporción estándar de tus gauges
    const CENTER = size / 2;
    const RADIUS = CENTER - BEZEL_SIZE;

    const dims = {
        CENTER,
        BEZEL_SIZE,
        RADIUS
    };

    const GAUGE_THEME = {
        colors: {
            bg: '#000000', // El fondo sólido que solicitaste en el patrón
            sailBlue: "#00ffff"
        }
    };

    const strokeWidth = 10;
    const dataRadius = dims.RADIUS - 15; // El arco de VMG por dentro del fondo
    const circumference = 2 * Math.PI * dataRadius;

    const performance = Math.min(vmg / targetVMG, 1.1);
    const isTopPerformance = performance >= 0.98;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Defs>
                    <GaugeDefs />

                    <LinearGradient id="vmgProgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="rgba(0, 255, 255, 0.1)" />
                        <Stop offset="100%" stopColor={isTopPerformance ? "#FFFFFF" : GAUGE_THEME.colors.sailBlue} />
                    </LinearGradient>

                    {/* Efectos de cristal y flare para la capa final */}
                    <LinearGradient id="gaugeGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="white" stopOpacity="0.15" />
                        <Stop offset="50%" stopColor="white" stopOpacity="0" />
                    </LinearGradient>
                    <RadialGradient id="sogFlare" cx="30%" cy="30%" rx="30%" ry="30%">
                        <Stop offset="0%" stopColor="white" stopOpacity="0.4" />
                        <Stop offset="100%" stopColor="white" stopOpacity="0" />
                    </RadialGradient>
                </Defs>

                {/* 1. ANILLO SIGUIENDO TU PATRÓN EXACTO */}
                <G>
                    {/* Capa Exterior del Bisel */}
                    <Circle
                        cx={dims.CENTER} cy={dims.CENTER}
                        r={dims.CENTER - (dims.BEZEL_SIZE / 4)}
                        fill="none"
                        stroke="url(#bezelOuter)"
                        strokeWidth={dims.BEZEL_SIZE / 2}
                    />
                    {/* Capa Interior del Bisel */}
                    <Circle
                        cx={dims.CENTER} cy={dims.CENTER}
                        r={dims.RADIUS + (dims.BEZEL_SIZE / 4)}
                        fill="none"
                        stroke="url(#bezelInner)"
                        strokeWidth={dims.BEZEL_SIZE / 2}
                    />

                </G>

                {/* 2. DATOS (ARCO VMG) */}
                <Path
                    d={`M ${dims.CENTER + dataRadius * Math.cos(2.35)} ${dims.CENTER + dataRadius * Math.sin(2.35)} 
                       A ${dataRadius} ${dataRadius} 0 1 1 ${dims.CENTER + dataRadius * Math.cos(0.78)} ${dims.CENTER + dataRadius * Math.sin(0.78)}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                <Circle
                    cx={dims.CENTER}
                    cy={dims.CENTER}
                    r={dataRadius}
                    fill="none"
                    stroke="url(#vmgProgGradient)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference * 0.75} ${circumference}`}
                    strokeDashoffset={circumference * 0.75 - (performance * circumference * 0.75)}
                    strokeLinecap="round"
                    transform={`rotate(135, ${dims.CENTER}, ${dims.CENTER})`}
                />

                {/* 3. CAPAS SUPERIORES (CRISTAL Y FLARE) */}
                <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.RADIUS} fill="url(#gaugeGlass)" pointerEvents="none" />
                <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.RADIUS} fill="url(#sogFlare)" pointerEvents="none" />
            </Svg>

            {/* Lectura central */}
            <View style={styles.labelContainer}>
                <Text style={styles.vmgTitle}>VMG</Text>
                <Text style={[styles.vmgValue, isTopPerformance && styles.glowText]}>
                    {vmg.toFixed(1)}
                </Text>
                <Text style={styles.unit}>KTS</Text>

                <View style={[styles.perfBadge, { backgroundColor: isTopPerformance ? GAUGE_THEME.colors.sailBlue : 'rgba(255,255,255,0.08)' }]}>
                    <Text style={[styles.perfText, { color: isTopPerformance ? '#000' : '#FFF' }]}>
                        {Math.round(performance * 100)}%
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    labelContainer: { position: 'absolute', alignItems: 'center', zIndex: 10 },
    vmgTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
    vmgValue: {
        color: '#FFF',
        fontSize: 34,
        fontWeight: 'bold',
        fontFamily: 'NauticalFont',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowRadius: 4
    },
    unit: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: -4 },
    perfBadge: {
        paddingHorizontal: 8,
        paddingVertical: 1,
        borderRadius: 3,
        marginTop: 6,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    perfText: { fontSize: 10, fontWeight: 'bold' },
    glowText: {
        textShadowColor: '#00ffff',
        textShadowRadius: 15,
    }
});

export default VMGNavigator;