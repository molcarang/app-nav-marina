import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { GaugeDefs } from './shared/GaugeDefs';
import { GAUGE_THEME } from '../../styles/GaugeTheme';

const RudderGauge = ({ angle = 0, size = 180, alertAngle = 30 }) => {
    const CENTER = size / 2;
    const BEZEL_SIZE = size * 0.12;
    const RADIUS = CENTER - BEZEL_SIZE;
    
    const rudderRadius = RADIUS - 15;
    const isAlertActive = Math.abs(angle) >= alertAngle;

    // --- LÓGICA DE EXPANSIÓN VISUAL ---
    // Aumentamos este factor para separar más los ticks (1.5 = 50% más de separación)
    const EXPANSION_FACTOR = 1.6; 
    const mapVisualAngle = (realAngle) => realAngle * EXPANSION_FACTOR;

    const COLOR_PORT = "#FF3B30";
    const COLOR_STBD = "#4CD964";
    const COLOR_CENTER = "#ffffff";

    // Arco de fondo expandido visualmente
    const limit = (alertAngle + 5) * EXPANSION_FACTOR;
    const startRad = (-limit - 90) * (Math.PI / 180);
    const endRad = (limit - 90) * (Math.PI / 180);
    const xStart = CENTER + (rudderRadius + 5) * Math.cos(startRad);
    const yStart = CENTER + (rudderRadius + 5) * Math.sin(startRad);
    const xEnd = CENTER + (rudderRadius + 5) * Math.cos(endRad);
    const yEnd = CENTER + (rudderRadius + 5) * Math.sin(endRad);
    const arcPath = `M ${xStart} ${yStart} A ${rudderRadius + 5} ${rudderRadius + 5} 0 0 1 ${xEnd} ${yEnd}`;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Defs>
                    <GaugeDefs />
                    <LinearGradient id="rudderGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="white" stopOpacity="0.15" />
                        <Stop offset="50%" stopColor="white" stopOpacity="0" />
                    </LinearGradient>
                    <RadialGradient id="rudderFlare" cx="30%" cy="30%" rx="35%" ry="35%">
                        <Stop offset="0%" stopColor="white" stopOpacity="0.4" />
                        <Stop offset="100%" stopColor="transparent" />
                    </RadialGradient>
                </Defs>

                {/* 1. ANILLO EXTERIOR */}
                <G>
                    <Circle cx={CENTER} cy={CENTER} r={CENTER - (BEZEL_SIZE / 4)} fill="none" stroke="url(#bezelOuter)" strokeWidth={BEZEL_SIZE / 2} />
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS + (BEZEL_SIZE / 4)} fill="none" stroke="url(#bezelInner)" strokeWidth={BEZEL_SIZE / 2} />
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill={GAUGE_THEME.colors.bg} />
                </G>

                {/* 2. ARCO DE FONDO EXPANDIDO */}
                <Path d={arcPath} fill="none" stroke="url(#bezelInner)" strokeWidth="20" strokeLinecap="round" opacity={0.2} />

                {/* 3. ESCALA CON SEPARACIÓN ARTIFICIAL */}
                {[-40, -30, -20, -10, 0, 10, 20, 30, 40].map((tick) => {
                    // Calculamos la posición visual multiplicando por el factor
                    const visualAngle = mapVisualAngle(tick);
                    const tickRad = (visualAngle - 90) * (Math.PI / 180);
                    
                    const tx1 = CENTER + (rudderRadius - 2) * Math.cos(tickRad);
                    const ty1 = CENTER + (rudderRadius - 2) * Math.sin(tickRad);
                    const tx2 = CENTER + (rudderRadius + 12) * Math.cos(tickRad);
                    const ty2 = CENTER + (rudderRadius + 12) * Math.sin(tickRad);
                    
                    let tickColor = tick === 0 ? COLOR_CENTER : (tick < 0 ? COLOR_PORT : COLOR_STBD);

                    return (
                        <G key={tick}>
                            <Line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={tickColor} strokeWidth={tick === 0 ? 3 : 2} opacity={0.8} />
                        </G>
                    );
                })}

                {/* 4. AGUJA (También expandida para coincidir con los ticks) */}
                <G transform={`translate(${CENTER}, ${CENTER}) rotate(${angle * EXPANSION_FACTOR})`}>
                    <Path d={`M -7 0 L 0 ${-rudderRadius} L 0 0 Z`} fill="url(#needleSideA)" />
                    <Path d={`M 7 0 L 0 ${-rudderRadius} L 0 0 Z`} fill="url(#needleSideB)" />
                    <Line x1="0" y1="0" x2="0" y2={-rudderRadius} stroke="url(#bezelRidge)" strokeWidth="1.2" />
                </G>

                {/* 5. HUB CENTRAL */}
                <G>
                    <Circle cx={CENTER + 1} cy={CENTER + 1} r={size * 0.048} fill="rgba(0,0,0,0.5)" />
                    <Circle cx={CENTER} cy={CENTER} r={size * 0.045} fill="url(#hub3D)" stroke="#444" strokeWidth="1" />
                </G>

                {/* 6. CRISTAL */}
                <G pointerEvents="none">
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#rudderGlass)" />
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#rudderFlare)" />
                </G>
            </Svg>

            {/* 7. LECTURA DIGITAL (Muestra el ángulo REAL, no el expandido) */}
            <View style={[styles.labelContainer, { top: CENTER + (RADIUS * 0.05) }]}>
                <Text style={[styles.angleText, isAlertActive && { color: '#FF4444' }]}>
                    {Math.abs(Math.round(angle))}°
                </Text>
                <Text style={styles.sideText}>
                    {angle < -1 ? 'PORT' : angle > 1 ? 'STBD' : 'CENTER'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    labelContainer: { position: 'absolute', alignItems: 'center', width: '100%', zIndex: 50 },
    angleText: { fontSize: 30, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'NauticalFont', textShadowColor: 'black', textShadowRadius: 6 },
    sideText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', letterSpacing: 2, marginTop: -4, fontWeight: 'bold' }
});

export default RudderGauge;