import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import VesselGaugeFrame from './VesselGaugeFrame';

const VMGNavigator = ({ vmg = 0, targetVMG = 6.5, size = 180 }) => {
    const CENTER = size / 2;
    const RADIUS = CENTER - (size * 0.12);
    
    // Configuración del arco de datos
    const strokeWidth = 10;
    const dataRadius = RADIUS - 15; 
    const circumference = 2 * Math.PI * dataRadius;

    const performance = Math.min(vmg / targetVMG, 1.1);
    const isTopPerformance = performance >= 0.98;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* 1. Usamos el Frame común (sin el Hub central para este caso) */}
            <VesselGaugeFrame size={size} showHub={false}>
                
                {/* 2. Definiciones locales específicas del VMG */}
                <Defs>
                    <LinearGradient id="vmgProgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="rgba(0, 255, 255, 0.1)" />
                        <Stop offset="100%" stopColor={isTopPerformance ? "#FFFFFF" : "#00ffff"} />
                    </LinearGradient>
                </Defs>

                {/* 3. Fondo del arco (Track gris sutil) */}
                <Path
                    d={`M ${CENTER + dataRadius * Math.cos(2.35)} ${CENTER + dataRadius * Math.sin(2.35)} 
                       A ${dataRadius} ${dataRadius} 0 1 1 ${CENTER + dataRadius * Math.cos(0.78)} ${CENTER + dataRadius * Math.sin(0.78)}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* 4. Arco de Progreso VMG */}
                <Circle
                    cx={CENTER}
                    cy={CENTER}
                    r={dataRadius}
                    fill="none"
                    stroke="url(#vmgProgGradient)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference * 0.75} ${circumference}`}
                    strokeDashoffset={circumference * 0.75 - (performance * circumference * 0.75)}
                    strokeLinecap="round"
                    transform={`rotate(135, ${CENTER}, ${CENTER})`}
                />
            </VesselGaugeFrame>

            {/* 5. LECTURA CENTRAL (Por encima de todo) */}
            <View style={styles.labelContainer}>
                <Text style={styles.vmgTitle}>VMG</Text>
                <Text style={[styles.vmgValue, isTopPerformance && styles.glowText]}>
                    {vmg.toFixed(1)}
                </Text>
                <Text style={styles.unit}>KTS</Text>

                <View style={[
                    styles.perfBadge, 
                    { backgroundColor: isTopPerformance ? "#00ffff" : 'rgba(255,255,255,0.08)' }
                ]}>
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
    labelContainer: { position: 'absolute', alignItems: 'center', zIndex: 50 },
    vmgTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
    vmgValue: {
        color: '#FFF',
        fontSize: 34,
        fontWeight: 'bold',
        fontFamily: 'NauticalFont',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowRadius: 6
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