import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path } from 'react-native-svg';
import { GaugeDefs } from './shared/GaugeDefs';

const RudderGauge = ({ angle = 0, size , alertAngle }) => {
    const width = size;
    const height = size * 0.7;
    const centerX = width / 2;
    const centerY = height * 0.9;
    const radius = size * 0.45;

    const rotation = angle;
    const baseWidth = 7;
    const tipWidth = 1.2;

    const sailBlue = "#00ffff";
    const sailBlueDark = "#0088aa";

    const limit = alertAngle + 5;
    const startRad = (-limit - 90) * (Math.PI / 180);
    const endRad = (limit - 90) * (Math.PI / 180);

    const xStart = centerX + (radius + 5) * Math.cos(startRad);
    const yStart = centerY + (radius + 5) * Math.sin(startRad);
    const xEnd = centerX + (radius + 5) * Math.cos(endRad);
    const yEnd = centerY + (radius + 5) * Math.sin(endRad);

    const arcPath = `M ${xStart} ${yStart} A ${radius + 5} ${radius + 5} 0 0 1 ${xEnd} ${yEnd}`;

    const isAlertActive = Math.abs(angle) >= alertAngle;

    return (
        <View style={[styles.container, { width, height: height }]}>
            <Svg width={width} height={height + 20} viewBox={`0 0 ${width} ${height + 20}`}>
                <Defs>
                    <GaugeDefs />
                </Defs>

                {/* 1. ARCO DE FONDO ANCHO */}
                <Path
                    d={arcPath}
                    fill="none"
                    stroke="url(#bezelInner)"
                    strokeWidth="24"
                    strokeLinecap="round"
                    opacity={0.4}
                />

                {/* 2. ESCALA DINÁMICA (Ticks de 5° y 15°) */}
                {[-45, -40, -35, -30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45].map((tick) => {
                    const isMainTick = tick % 15 === 0; // Ticks principales (0, 15, 30, 45)
                    const tickRad = (tick - 90) * (Math.PI / 180);
                    const isLit = Math.abs(angle - tick) < 3;

                    // Ticks principales son más largos, los de 5° son cortitos
                    const tickSize = isMainTick ? 15 : 6;
                    const tx1 = centerX + (radius - 5) * Math.cos(tickRad);
                    const ty1 = centerY + (radius - 5) * Math.sin(tickRad);
                    const tx2 = centerX + (radius + tickSize) * Math.cos(tickRad);
                    const ty2 = centerY + (radius + tickSize) * Math.sin(tickRad);

                    return (
                        <Line
                            key={tick}
                            x1={tx1} y1={ty1} x2={tx2} y2={ty2}
                            stroke={isLit ? "#FFFFFF" : (tick === 0 ? sailBlue : sailBlueDark)}
                            strokeWidth={isMainTick ? 2.5 : 1}
                            opacity={isMainTick ? 0.6 : 0.4}
                        />
                    );
                })}

                {/* 3. RESPLANDOR DE ALERTA */}
                {isAlertActive && (
                    <G opacity={0.4}>
                        <Circle cx={centerX} cy={centerY} r={size * 0.12} fill="url(#bezelRidge)" opacity={0.2} />
                        <Circle cx={centerX} cy={centerY} r={size * 0.08} fill="#FF0000" opacity={0.3} />
                    </G>
                )}

                {/* 4. AGUJA TIPO SOGGAUGE */}
                <G transform={`translate(${centerX}, ${centerY}) rotate(${rotation})`}>
                    <Path
                        d={`M ${-baseWidth} 0 L ${baseWidth} 0 L ${tipWidth} ${-radius} L ${-tipWidth} ${-radius} Z`}
                        fill="black"
                        opacity={0.4}
                        transform="translate(2, 2)"
                    />
                    <Path d={`M ${-baseWidth} 0 L 0 ${-radius} L 0 0 Z`} fill="url(#needleSideA)" />
                    <Path d={`M ${baseWidth} 0 L 0 ${-radius} L 0 0 Z`} fill="url(#needleSideB)" />
                    <Line
                        x1="0" y1="0" x2="0" y2={-radius}
                        stroke="url(#bezelRidge)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                    />
                </G>

                {/* 5. TAPÓN CENTRAL */}
                <G pointerEvents="none">
                    <Circle cx={centerX + 1.5} cy={centerY + 1.5} r={size * 0.048} fill="rgba(0,0,0,0.5)" />
                    <Circle cx={centerX} cy={centerY} r={size * 0.045} fill="url(#hub3D)" stroke="#444" strokeWidth="1" />
                    <Circle
                        cx={centerX - (size * 0.015)}
                        cy={centerY - (size * 0.015)}
                        r={size * 0.012}
                        fill="rgba(255,255,255,0.3)"
                    />
                </G>
            </Svg>

            {/* 6. LECTURA DIGITAL */}
            <View style={[styles.labelContainer, { top: height * 0.35 }]}>
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
    labelContainer: { position: 'absolute', alignItems: 'center', width: '100%' },
    angleText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: 'NauticalFont',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4
    },
    sideText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 2,
        marginTop: -4,
        fontWeight: '600'
    }
});

export default RudderGauge;