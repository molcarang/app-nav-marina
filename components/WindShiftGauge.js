import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Line, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { describeArc } from '../utils/Utils';
import { GAUGE_THEME } from '../styles/GaugeTheme';
import { GaugeDefs } from './gauges/shared/GaugeDefs';

const WindShiftGauge = ({ currentTWD = 0, meanTWD = 0, size = 180 }) => {
    const CENTER = size / 2;
    const RADIUS = CENTER - (size * 0.12);
    
    // Diferencia entre el viento actual y la media (el "shift")
    // Lo limitamos a +/- 20 grados para que la escala sea legible
    const shift = currentTWD - meanTWD;
    const displayShift = Math.max(-20, Math.min(20, shift));

    const isLift = shift > 0; // Dependiendo de la amura, pero simplificamos: Verde es bueno
    const shiftColor = shift > 0 ? "#4CD964" : "#FF3B30";

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
                <Defs>
                    <GaugeDefs />
                    <LinearGradient id="glass" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="white" stopOpacity="0.15" />
                        <Stop offset="100%" stopColor="transparent" />
                    </LinearGradient>
                </Defs>

                {/* 1. ANILLO VESSEL */}
                <G>
                    <Circle cx={CENTER} cy={CENTER} r={CENTER - 5} fill="none" stroke="url(#bezelOuter)" strokeWidth={size * 0.06} />
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill={GAUGE_THEME.colors.bg} />
                </G>

                {/* 2. ESCALA DE ROLES (-20° a +20°) */}
                <G opacity={0.3}>
                    {[-20, -10, 0, 10, 20].map(tick => {
                        const angle = 270 + (tick * 4); // Escalamos visualmente x4
                        const rad = (angle - 90) * (Math.PI / 180);
                        return (
                            <Line 
                                key={tick}
                                x1={CENTER + (RADIUS - 5) * Math.cos(rad)}
                                y1={CENTER + (RADIUS - 5) * Math.sin(rad)}
                                x2={CENTER + RADIUS * Math.cos(rad)}
                                y2={CENTER + RADIUS * Math.sin(rad)}
                                stroke="white" strokeWidth={2}
                            />
                        );
                    })}
                </G>

                {/* 3. ARCO DINÁMICO DEL SHIFT */}
                <Path 
                    d={describeArc(CENTER, CENTER, RADIUS - 10, 270, 270 + (displayShift * 4))}
                    fill="none"
                    stroke={shiftColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                />

                {/* 4. AGUJA TIPO SOG */}
                <G transform={`translate(${CENTER}, ${CENTER}) rotate(${displayShift * 4})`}>
                    <Path d="M -5 0 L 0 -60 L 5 0 Z" fill={shiftColor} opacity={0.8} />
                </G>

                {/* 5. CRISTAL */}
                <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#glass)" pointerEvents="none" />
            </Svg>

            {/* LECTURA DIGITAL */}
            <View style={styles.labelContainer}>
                <Text style={[styles.shiftValue, { color: shiftColor }]}>
                    {shift > 0 ? `+${shift.toFixed(1)}` : shift.toFixed(1)}°
                </Text>
                <Text style={styles.subText}>WIND SHIFT</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    labelContainer: { position: 'absolute', alignItems: 'center' },
    shiftValue: { fontSize: 24, fontWeight: 'bold', fontFamily: 'NauticalFont' },
    subText: { fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }
});

export default WindShiftGauge;