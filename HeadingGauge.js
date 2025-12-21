import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Text as SvgText } from 'react-native-svg';
// Asegúrate de que lerpAngle esté en tu archivo Utils
import { polarToCartesian, describeArc, lerpAngle } from './utils/Utils';

const HeadingGauge = ({
    size: COMPASS_SIZE = 400,
    value, // Este es el valor numérico del rumbo (heading) en grados
    minLayline = 20,
    maxLayline = 60,
    unit,
    headingColor,
    twd,
    twaCog,
    isNightMode,
    set
}) => {
    // --- 1. LÓGICA DE SUAVIZADO (LERP) ---
    // Inicializamos con el valor actual para evitar saltos al cargar
    const [displayHeading, setDisplayHeading] = useState(parseFloat(value) || 0);
    const requestRef = useRef();
    const SMOOTH_FACTOR = 0.1;

    const animate = () => {
        setDisplayHeading(prev => {
            // Usamos lerpAngle que importamos de Utils para manejar el salto de 360°
            const nextValue = lerpAngle(prev, parseFloat(value) || 0, SMOOTH_FACTOR);
            
            if (Math.abs(nextValue - prev) < 0.01) return prev;
            return nextValue;
        });
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [value]); // Se activa cuando cambia el rumbo que viene de SignalK

    // ESTA ES LA ÚNICA DECLARACIÓN DE rotationAngle
    const rotationAngle = -displayHeading;

    // --- 2. PARÁMETROS PROPORCIONALES ---
    const CENTER = COMPASS_SIZE / 2;
    const RADIUS = CENTER - COMPASS_SIZE * 0.036; 
    const INNER_RADIUS = RADIUS - COMPASS_SIZE * 0.1; 
    const FONT_SIZE_NUMERIC = Math.round(COMPASS_SIZE * 0.032); 
    const FONT_SIZE_CARDINAL_LETTER = Math.round(COMPASS_SIZE * 0.051); 

    const COLOR_CIRCLE_BG = 'rgba(40, 40, 40, 0.75)';
    const COLOR_BORDER = '#fff';
    const COLOR_RED = '#dc1212ff';
    const COLOR_TWA = '#ff9800';
    const COLOR_TWD = '#2196f3';

    const TEXT_RADIUS_OUTER = RADIUS - COMPASS_SIZE * 0.11; 
    const TEXT_RADIUS_CARDINAL = COMPASS_SIZE * 0.255; 
    const WIND_INDICATOR_DISTANCE = RADIUS + COMPASS_SIZE * 0.018; 
    const RADIUS_ARCS = RADIUS + 15;

    const setAngle = parseFloat(set) || 0;
    const formattedHeading = isNaN(parseFloat(value)) ? '---' : parseFloat(value).toFixed(0);
    const finalHeadingColor = headingColor || COLOR_RED;
    const fontFamily = 'NauticalFont';

    const getTick = (angleDeg, innerR, outerR, color, isBold) => {
        const angleRad = (angleDeg - 90) * (Math.PI / 180);
        return (
            <Line
                key={`tick-${angleDeg}`}
                x1={CENTER + innerR * Math.cos(angleRad)}
                y1={CENTER + innerR * Math.sin(angleRad)}
                x2={CENTER + outerR * Math.cos(angleRad)}
                y2={CENTER + outerR * Math.sin(angleRad)}
                stroke={color}
                strokeWidth={isBold ? COMPASS_SIZE * 0.0036 : COMPASS_SIZE * 0.0018}
            />
        );
    };

    const numericalMarks = [30, 60, 120, 150, 210, 240, 300, 330];
    const cardinalMarks = [
        { deg: 0, label: 'N', val: '0' }, { deg: 90, label: 'E', val: '90' },
        { deg: 180, label: 'S', val: '180' }, { deg: 270, label: 'O', val: '270' }
    ];

    return (
        <View style={[styles.outerContainer, { width: COMPASS_SIZE + 10, height: COMPASS_SIZE }]}>
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>

                {/* 1. DIAL ROTATORIO */}
                <G rotation={rotationAngle} origin={`${CENTER}, ${CENTER}`}>
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill={COLOR_CIRCLE_BG} stroke={COLOR_BORDER} strokeWidth="5" />
                    <Circle cx={CENTER} cy={CENTER} r={INNER_RADIUS - 35} fill={COLOR_CIRCLE_BG} stroke={COLOR_BORDER} strokeWidth="1" />

                    {Array.from({ length: 72 }).map((_, i) => {
                        const deg = i * 5;
                        if (deg % 30 === 0) return getTick(deg, INNER_RADIUS + COMPASS_SIZE * 0.027, RADIUS, COLOR_RED, true);
                        if (deg % 10 === 0) return getTick(deg, INNER_RADIUS + COMPASS_SIZE * 0.027, RADIUS, COLOR_BORDER, false);
                        return getTick(deg, INNER_RADIUS + COMPASS_SIZE * 0.045, RADIUS, COLOR_BORDER, false);
                    })}

                    {numericalMarks.concat([0, 90, 180, 270]).map(deg => {
                        const pos = polarToCartesian(CENTER, CENTER, TEXT_RADIUS_OUTER, deg);
                        return (
                            <SvgText
                                key={`num-${deg}`} x={pos.x} y={pos.y + (FONT_SIZE_NUMERIC / 3)} textAnchor="middle"
                                fontSize={FONT_SIZE_NUMERIC} fill={deg % 90 === 0 ? COLOR_RED : COLOR_BORDER}
                                fontFamily={fontFamily} 
                                rotation={-rotationAngle} origin={`${pos.x}, ${pos.y}`}
                            >
                                {deg}
                            </SvgText>
                        );
                    })}

                    {cardinalMarks.map(({ deg, label }) => {
                        const pos = polarToCartesian(CENTER, CENTER, TEXT_RADIUS_CARDINAL, deg);
                        return (
                            <SvgText
                                key={`card-${label}`} x={pos.x} y={pos.y + (FONT_SIZE_CARDINAL_LETTER / 3)} textAnchor="middle"
                                fontSize={FONT_SIZE_CARDINAL_LETTER} fill={COLOR_RED}
                                fontFamily={fontFamily} 
                                rotation={-rotationAngle} origin={`${pos.x}, ${pos.y}`}
                            >
                                {label}
                            </SvgText>
                        );
                    })}
                </G>

                {/* 2. CORRIENTE (Gira con el dial) */}
                <G rotation={rotationAngle + setAngle} origin={`${CENTER}, ${CENTER}`}>
                    <Path
                        d={`M ${CENTER - COMPASS_SIZE * 0.045} ${CENTER + COMPASS_SIZE * 0.218} L ${CENTER + COMPASS_SIZE * 0.045} ${CENTER + COMPASS_SIZE * 0.218} L ${CENTER + COMPASS_SIZE * 0.045} ${CENTER - COMPASS_SIZE * 0.073} L ${CENTER + COMPASS_SIZE * 0.1} ${CENTER - COMPASS_SIZE * 0.073} L ${CENTER} ${CENTER - COMPASS_SIZE * 0.273} L ${CENTER - COMPASS_SIZE * 0.1} ${CENTER - COMPASS_SIZE * 0.073} L ${CENTER - COMPASS_SIZE * 0.045} ${CENTER - COMPASS_SIZE * 0.073} Z`}
                        fill="none" stroke="#00ffff" strokeWidth="4" opacity={0.3}
                    />
                </G>

                {/* 3. BARCO (Estático) */}
                <G opacity={isNightMode ? 0.25 : 0.15}>
                    <Path
                        d={`M ${CENTER} ${CENTER - COMPASS_SIZE * 0.3} C ${CENTER + COMPASS_SIZE * 0.091} ${CENTER - COMPASS_SIZE * 0.145}, ${CENTER + COMPASS_SIZE * 0.082} ${CENTER + COMPASS_SIZE * 0.182}, ${CENTER + COMPASS_SIZE * 0.073} ${CENTER + COMPASS_SIZE * 0.282} L ${CENTER - COMPASS_SIZE * 0.073} ${CENTER + COMPASS_SIZE * 0.282} C ${CENTER - COMPASS_SIZE * 0.082} ${CENTER + COMPASS_SIZE * 0.182}, ${CENTER - COMPASS_SIZE * 0.091} ${CENTER - COMPASS_SIZE * 0.145}, ${CENTER} ${CENTER - COMPASS_SIZE * 0.3} Z`}
                        fill="none" stroke={isNightMode ? "#f00" : "#fff"} strokeWidth="2.5"
                    />
                    <Line x1={CENTER} y1={CENTER - COMPASS_SIZE * 0.3} x2={CENTER} y2={CENTER + COMPASS_SIZE * 0.282} stroke={isNightMode ? "#f00" : "#fff"} strokeDasharray={`${COMPASS_SIZE * 0.0073}, ${COMPASS_SIZE * 0.0218}`} />
                </G>

                {/* 4. ARCOS DE CEÑIDA (Estáticos respecto al barco) */}
                <G>
                    <Path d={describeArc(CENTER, CENTER, RADIUS_ARCS, minLayline, maxLayline)} fill="none" stroke="#00ff00" strokeWidth={COMPASS_SIZE * 0.027} strokeLinecap="round" opacity={0.5} />
                    <Path d={describeArc(CENTER, CENTER, RADIUS_ARCS, 360 - maxLayline, 360 - minLayline)} fill="none" stroke="#ff0000" strokeWidth={COMPASS_SIZE * 0.027} strokeLinecap="round" opacity={0.5} />
                </G>

                {/* 5. VIENTOS (Giran con el dial) */}
                {typeof twaCog === 'number' && (
                    <G rotation={rotationAngle + twaCog} origin={`${CENTER}, ${CENTER}`}>
                        <Line x1={CENTER} y1={CENTER} x2={CENTER} y2={CENTER - WIND_INDICATOR_DISTANCE} stroke={COLOR_TWA} strokeWidth="2" strokeDasharray="5, 5" />
                        <Polygon points={`${CENTER - COMPASS_SIZE * 0.036},5 ${CENTER + COMPASS_SIZE * 0.036},5 ${CENTER},${COMPASS_SIZE * 0.082}`} fill={COLOR_TWA} stroke={COLOR_BORDER} strokeWidth="1" />
                    </G>
                )}

                {typeof twd === 'number' && (
                    <G rotation={rotationAngle + twd} origin={`${CENTER}, ${CENTER}`}>
                        <Line x1={CENTER} y1={CENTER} x2={CENTER} y2={CENTER - WIND_INDICATOR_DISTANCE} stroke={COLOR_TWD} strokeWidth="2" strokeDasharray="5, 5" />
                        <Polygon points={`${CENTER - COMPASS_SIZE * 0.036},5 ${CENTER + COMPASS_SIZE * 0.036},5 ${CENTER},${COMPASS_SIZE * 0.073}`} fill={COLOR_TWD} stroke={COLOR_BORDER} strokeWidth="1" />
                    </G>
                )}

                <Line x1={CENTER} y1={CENTER} x2={CENTER} y2={COMPASS_SIZE * 0.045} stroke={COLOR_RED} strokeWidth={COMPASS_SIZE * 0.0036} />
                <Polygon points={`${CENTER - COMPASS_SIZE * 0.036},5 ${CENTER + COMPASS_SIZE * 0.036},5 ${CENTER},${COMPASS_SIZE * 0.082}`} fill={finalHeadingColor} stroke={COLOR_BORDER} strokeWidth={COMPASS_SIZE * 0.0036} />

            </Svg>

            {/* 6. DISPLAY DIGITAL */}
            <View style={[styles.digitalDisplay, { top: CENTER - COMPASS_SIZE * 0.045 }]}>
                <Text style={[styles.headingText, { color: finalHeadingColor, fontSize: Math.round(COMPASS_SIZE * 0.087) }]}>{formattedHeading}</Text>
                {unit && <Text style={[styles.unitText, { fontSize: Math.round(COMPASS_SIZE * 0.036) }]}>{unit}</Text>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: { alignItems: 'center', justifyContent: 'flex-start', marginBottom: 15 },
    digitalDisplay: { position: 'absolute', alignItems: 'center' },
    headingText: { fontWeight: 'bold', fontFamily: 'NauticalFont' },
    unitText: { color: '#fff', marginTop: -10, fontFamily: 'NauticalFont' },
});

export default HeadingGauge;