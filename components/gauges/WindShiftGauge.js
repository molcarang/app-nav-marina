import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { G, Line, Path } from 'react-native-svg';
import { describeArc } from '../../utils/Utils';
import VesselGaugeFrame from './VesselGaugeFrame';

const WindShiftGauge = ({ currentTWD = 0, meanTWD = 0, size = 180 }) => {
    const CENTER = size / 2;
    const RADIUS = CENTER - (size * 0.12);

    // Lógica de cálculo del Shift
    const shift = currentTWD - meanTWD;
    const displayShift = Math.max(-20, Math.min(20, shift));
    const shiftColor = shift > 0 ? "#4CD964" : "#FF3B30";

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <VesselGaugeFrame size={size} showHub={true}>
                
                {/* 1. ESCALA DE ROLES (Fijada en el fondo) */}
                <G opacity={0.3}>
                    {[-20, -10, 0, 10, 20].map(tick => {
                        const angle = 270 + (tick * 4); 
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

                {/* 2. ARCO DINÁMICO */}
                <Path
                    d={describeArc(CENTER, CENTER, RADIUS - 10, 270, 270 + (displayShift * 4))}
                    fill="none"
                    stroke={shiftColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                />

                {/* 3. AGUJA (Aparecerá debajo del Hub gracias al Frame) */}
                <G transform={`translate(${CENTER}, ${CENTER}) rotate(${displayShift * 4})`}>
                    <Path d="M -5 0 L 0 -60 L 5 0 Z" fill={shiftColor} opacity={0.8} />
                </G>

            </VesselGaugeFrame>

            {/* 4. LECTURA DIGITAL */}
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
    labelContainer: { position: 'absolute', alignItems: 'center', zIndex: 50 },
    shiftValue: { fontSize: 24, fontWeight: 'bold', fontFamily: 'NauticalFont' },
    subText: { fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }
});

export default WindShiftGauge;