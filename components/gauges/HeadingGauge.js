import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
    Circle,
    Defs,
    Ellipse,
    G, Line,
    Path, Polygon,
    Text as SvgText
} from 'react-native-svg';
import { GAUGE_THEME } from '../../styles/GaugeTheme';
import { describeArc, lerpAngle } from '../../utils/Utils';
import { GaugeDefs } from './shared/GaugeDefs';
import { computeCommonDims } from './shared/gaugeUtils';

const HeadingGauge = React.memo(({
    size,
    value = 0,
    minLayline = 20,
    maxLayline = 60,
    twd,
    twaCog,
    isNightMode,
    set = 0,
    drift = 0
}) => {
    // --- 1. ESTADO Y ANIMACIÓN ---
    // Tamaño relativo a la pantalla si no se pasa size
    const { width: windowWidth, height: windowHeight } = require('react-native').useWindowDimensions();
    const COMPASS_SIZE = size || Math.min(windowWidth * 0.9, windowHeight * 0.45);

    const [display, setDisplay] = useState({
        heading: parseFloat(value) || 0,
        twa: twaCog || 0,
        twd: twd || 0,
        pulse: 0
    });
    const requestRef = useRef();

    useEffect(() => {
        let mounted = true;
        const animate = (time) => {
            setDisplay(prev => {
                // Solo actualiza si hay cambios significativos
                const nextHeading = lerpAngle(prev.heading, parseFloat(value) || 0, 0.1);
                const nextTwa = typeof twaCog === 'number' ? lerpAngle(prev.twa, twaCog, 0.1) : prev.twa;
                const nextTwd = typeof twd === 'number' ? lerpAngle(prev.twd, twd, 0.1) : prev.twd;
                const nextPulse = time ? (Math.sin(time / 600) + 1) / 2 : prev.pulse;
                // Solo setState si cambia algo relevante
                if (
                    Math.abs(nextHeading - prev.heading) > 0.01 ||
                    Math.abs(nextTwa - prev.twa) > 0.01 ||
                    Math.abs(nextTwd - prev.twd) > 0.01 ||
                    Math.abs(nextPulse - prev.pulse) > 0.01
                ) {
                    return { heading: nextHeading, twa: nextTwa, twd: nextTwd, pulse: nextPulse };
                }
                return prev;
            });
            if (mounted) requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            mounted = false;
            cancelAnimationFrame(requestRef.current);
        };
    }, [value, twaCog, twd]);

    // --- 2. DIMENSIONES Y CÁLCULOS ---
    const dims = useMemo(() => {
        const base = computeCommonDims(COMPASS_SIZE);
        return {
            ...base,
            FONT_NUM: Math.round(COMPASS_SIZE * 0.035),
            FONT_CARD: Math.round(COMPASS_SIZE * 0.050),
            RADIUS_ARCS: base.RADIUS - 13
        };
    }, [COMPASS_SIZE]);

    const rotationAngle = -display.heading;

    return (
        <View style={[styles.outerContainer, { width: COMPASS_SIZE, height: COMPASS_SIZE }]}>
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>
                <Defs>
                    <GaugeDefs />
                </Defs>

                {/* --- CAPA 1: FONDO Y BISEL EXTERIOR --- */}
                <G>
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.CENTER - (dims.BEZEL_SIZE / 4)} fill="none" stroke="url(#bezelOuter)" strokeWidth={dims.BEZEL_SIZE / 2} />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.RADIUS + (dims.BEZEL_SIZE / 4)} fill="none" stroke="url(#bezelInner)" strokeWidth={dims.BEZEL_SIZE / 2} />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.CENTER - (dims.BEZEL_SIZE / 2)} fill="none" stroke="url(#bezelRidge)" strokeWidth="1.5" opacity={0.6} />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.RADIUS} fill={GAUGE_THEME.colors.bg} />
                </G>

                {/* --- CAPA 2: ELEMENTOS ESTÁTICOS (BARCO Y LAYLINES) --- */}
                <G>
                    {/* Laylines */}
                    <Path
                        d={describeArc(dims.CENTER, dims.CENTER, dims.RADIUS_ARCS, minLayline, maxLayline)}
                        fill="none" stroke="#00ff00" strokeWidth={COMPASS_SIZE * 0.07} strokeLinecap="butt" opacity={0.5}
                    />
                    <Path
                        d={describeArc(dims.CENTER, dims.CENTER, dims.RADIUS_ARCS, 360 - maxLayline, 360 - minLayline)}
                        fill="none" stroke="#ff0000" strokeWidth={COMPASS_SIZE * 0.07} strokeLinecap="butt" opacity={0.5}
                    />

                    {/* Barco estilizado */}
                    <G opacity={isNightMode ? 0.3 : 0.4}>
                        <Path
                            d={`
            M ${dims.CENTER} ${dims.CENTER - COMPASS_SIZE * 0.22} 
            C ${dims.CENTER + COMPASS_SIZE * 0.08} ${dims.CENTER - COMPASS_SIZE * 0.10}, 
              ${dims.CENTER + COMPASS_SIZE * 0.075} ${dims.CENTER + COMPASS_SIZE * 0.15}, 
              ${dims.CENTER + COMPASS_SIZE * 0.07} ${dims.CENTER + COMPASS_SIZE * 0.21} 
            L ${dims.CENTER - COMPASS_SIZE * 0.07} ${dims.CENTER + COMPASS_SIZE * 0.21} 
            C ${dims.CENTER - COMPASS_SIZE * 0.075} ${dims.CENTER + COMPASS_SIZE * 0.15}, 
              ${dims.CENTER - COMPASS_SIZE * 0.08} ${dims.CENTER - COMPASS_SIZE * 0.10}, 
              ${dims.CENTER} ${dims.CENTER - COMPASS_SIZE * 0.22} 
            Z
        `}
                            fill="none"
                            stroke="#fff"
                            strokeWidth="2"
                        />
                        {/* Línea de crujía ajustada al nuevo tamaño */}
                        <Line
                            x1={dims.CENTER}
                            y1={dims.CENTER - COMPASS_SIZE * 0.22}
                            x2={dims.CENTER}
                            y2={dims.CENTER + COMPASS_SIZE * 0.21}
                            stroke="#fff"
                            strokeDasharray="3, 5"
                            opacity={0.5}
                        />
                    </G>
                </G>
                {/* --- CAPA 3: DIAL ROTATIVO (NÚMEROS EXTERIORES Y CARDINALES INTERIORES) --- */}
                <G rotation={rotationAngle} origin={`${dims.CENTER}, ${dims.CENTER}`}>
                    {Array.from({ length: 72 }).map((_, i) => {
                        const deg = i * 5;
                        const angleRad = (deg - 90) * (Math.PI / 180);
                        const isMajor = deg % 30 === 0;
                        const isMid = deg % 10 === 0;
                        const tLen = isMajor ? 20 : isMid ? 12 : 7;

                        const degreeRad = dims.RADIUS - 35;
                        const cardinalRad = dims.INNER_RADIUS - 65;

                        return (
                            <G key={`tick-${deg}`}>
                                <Line
                                    x1={dims.CENTER + (dims.RADIUS - tLen) * Math.cos(angleRad)}
                                    y1={dims.CENTER + (dims.RADIUS - tLen) * Math.sin(angleRad)}
                                    x2={dims.CENTER + dims.RADIUS * Math.cos(angleRad)}
                                    y2={dims.CENTER + dims.RADIUS * Math.sin(angleRad)}
                                    stroke={isMajor ? GAUGE_THEME.colors.red : (isMid ? "#fff" : "rgba(255,255,255,0.4)")}
                                    strokeWidth={isMajor ? 3 : 1.5}
                                />

                                {isMajor && (
                                    <G>
                                        <G rotation={-rotationAngle} origin={`${dims.CENTER + degreeRad * Math.cos(angleRad)}, ${dims.CENTER + degreeRad * Math.sin(angleRad)}`}>
                                            <SvgText
                                                x={dims.CENTER + degreeRad * Math.cos(angleRad)}
                                                y={dims.CENTER + degreeRad * Math.sin(angleRad) + 5}
                                                fill="white"
                                                fontSize={dims.FONT_NUM}
                                                textAnchor="middle"
                                                fontFamily="NauticalFont"
                                            >
                                                {deg}
                                            </SvgText>
                                        </G>

                                        {(deg % 90 === 0) && (
                                            <G rotation={-rotationAngle} origin={`${dims.CENTER + cardinalRad * Math.cos(angleRad)}, ${dims.CENTER + cardinalRad * Math.sin(angleRad)}`}>
                                                <SvgText
                                                    x={dims.CENTER + cardinalRad * Math.cos(angleRad)}
                                                    y={dims.CENTER + cardinalRad * Math.sin(angleRad) + 5}
                                                    fill={GAUGE_THEME.colors.red}
                                                    fontSize={dims.FONT_CARD}
                                                    textAnchor="middle"
                                                    fontFamily="NauticalFont"
                                                >
                                                    {deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'O' : ''}
                                                </SvgText>
                                            </G>
                                        )}
                                    </G>
                                )}
                            </G>
                        );
                    })}

                    {/* --- INDICADORES DE VIENTO CON LÍNEAS DE UNIÓN --- */}

                    {/* --- INDICADORES DE VIENTO CON LÍNEAS VISIBLES --- */}

                    {/* Viento Aparente (TWA) en azul */}
                    {typeof twaCog === 'number' && (
                        <G rotation={display.twa} origin={`${dims.CENTER}, ${dims.CENTER}`}>
                            <Line
                                x1={dims.CENTER} y1={dims.CENTER}
                                x2={dims.CENTER} y2={dims.BEZEL_SIZE + 35}
                                stroke="#ff9800" strokeWidth="2" strokeDasharray="5, 3" opacity={0.8}
                            />
                            <Polygon
                                points={`${dims.CENTER - 14},${dims.BEZEL_SIZE + 5} ${dims.CENTER + 14},${dims.BEZEL_SIZE + 5} ${dims.CENTER},${dims.BEZEL_SIZE + 35}`}
                                fill="url(#needleOrange)" stroke="#fff" strokeWidth="1"
                            />
                        </G>
                    )}

                    {/* Viento Real (TWD) en naranja */}
                    {typeof twd === 'number' && (
                        <G rotation={display.twd} origin={`${dims.CENTER}, ${dims.CENTER}`}>
                            <Line
                                x1={dims.CENTER} y1={dims.CENTER}
                                x2={dims.CENTER} y2={dims.BEZEL_SIZE + 35}
                                stroke="#2196f3" strokeWidth="2" strokeDasharray="5, 3" opacity={0.8}
                            />
                            <Polygon
                                points={`${dims.CENTER - 14},${dims.BEZEL_SIZE + 5} ${dims.CENTER + 14},${dims.BEZEL_SIZE + 5} ${dims.CENTER},${dims.BEZEL_SIZE + 35}`}
                                fill="url(#needleBlue)" stroke="#fff" strokeWidth="1"
                            />
                        </G>
                    )}
                </G>
                {/* --- CAPA 4: ANILLO ROJO MECANIZADO (ENCIMA DEL DIAL) --- */}
                <G>
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.INNER_RADIUS - 30} fill="none" stroke="url(#redMetalOuter)" strokeWidth="6" />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.INNER_RADIUS - 36} fill="none" stroke="url(#redMetalInner)" strokeWidth="6" />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.INNER_RADIUS - 33} fill="none" stroke="url(#redMetalRidge)" strokeWidth="1.5" opacity={0.8} />
                </G>
                {/* --- CAPA 5: CORRIENTE (DRIFT / SET) --- */}
                {drift > 0.1 && (
                    <G rotation={rotationAngle + set} origin={`${dims.CENTER}, ${dims.CENTER}`}>
                        {/* Triángulo de Drift */}
                        <Polygon
                            points={`
                ${dims.CENTER - 15},${dims.CENTER + COMPASS_SIZE * 0.15} 
                ${dims.CENTER + 15},${dims.CENTER + COMPASS_SIZE * 0.15} 
                ${dims.CENTER},${dims.CENTER + COMPASS_SIZE * 0.26}
            `}
                            fill={drift > 2.0 ? "#ffcc00" : "#00ffff"}
                            opacity={0.5 + (display.pulse * 0.3)}
                        />

                        {/* Texto de velocidad */}
                        <SvgText
                            x={dims.CENTER}
                            y={dims.CENTER + COMPASS_SIZE * 0.30}
                            fill={drift > 2.0 ? "#ffcc00" : "#00ffff"}
                            fontSize={dims.FONT_NUM * 0.8}
                            textAnchor="middle"
                            fontFamily="NauticalFont"
                            rotation={-(rotationAngle + set)}
                            origin={`${dims.CENTER}, ${dims.CENTER + COMPASS_SIZE * 0.30}`}
                        >
                            {drift.toFixed(1)} kn
                        </SvgText>
                    </G>
                )}



                {/* --- AGUJA DE COMPÁS PROFESIONAL 3D --- */}
                <G pointerEvents="none">
                    {/* PUNTA NORTE (ROJA 3D) */}
                    {/* Lado Izquierdo (Luz) */}
                    <Polygon
                        points={`${dims.CENTER},${dims.CENTER - (COMPASS_SIZE * 0.25)} ${dims.CENTER - 10},${dims.CENTER} ${dims.CENTER},${dims.CENTER}`}
                        fill="url(#needleSideA)"
                    />
                    {/* Lado Derecho (Sombra) */}
                    <Polygon
                        points={`${dims.CENTER},${dims.CENTER - (COMPASS_SIZE * 0.25)} ${dims.CENTER + 10},${dims.CENTER} ${dims.CENTER},${dims.CENTER}`}
                        fill="url(#needleSideB)"
                    />

                    {/* PUNTA SUR (BLANCA/GRIS 3D PARA CONTRASTE) */}
                    {/* Lado Izquierdo */}
                    <Polygon
                        points={`${dims.CENTER},${dims.CENTER + (COMPASS_SIZE * 0.25)} ${dims.CENTER - 10},${dims.CENTER} ${dims.CENTER},${dims.CENTER}`}
                        fill="#e0e0e0"
                    />
                    {/* Lado Derecho */}
                    <Polygon
                        points={`${dims.CENTER},${dims.CENTER + (COMPASS_SIZE * 0.25)} ${dims.CENTER + 10},${dims.CENTER} ${dims.CENTER},${dims.CENTER}`}
                        fill="#9e9e9e"
                    />

                    {/* Borde de acabado blanco fino alrededor de toda la aguja */}
                    <Polygon
                        points={`
            ${dims.CENTER},${dims.CENTER - (COMPASS_SIZE * 0.25)}
            ${dims.CENTER + 10},${dims.CENTER}
            ${dims.CENTER},${dims.CENTER + (COMPASS_SIZE * 0.25)}
            ${dims.CENTER - 10},${dims.CENTER}
        `}
                        fill="none"
                        stroke="#fff"
                        strokeWidth="0.5"
                        opacity={0.6}
                    />

                    {/* HUB CENTRAL (El botón del centro del SogGauge) */}
                    <G>
                        <Circle cx={dims.CENTER + 1} cy={dims.CENTER + 1} r={8} fill="rgba(0,0,0,0.4)" />
                        <Circle cx={dims.CENTER} cy={dims.CENTER} r={7} fill="url(#hub3D)" stroke="#444" strokeWidth="1" />
                        <Circle cx={dims.CENTER - 2} cy={dims.CENTER - 2} r={2} fill="rgba(255,255,255,0.2)" />
                    </G>
                </G>

                {/* --- CAPA FINAL: CRISTAL --- */}
                <G pointerEvents="none">
                    {/* 1. Reflejo elíptico superior */}
                    <Ellipse
                        cx={dims.CENTER}
                        cy={dims.CENTER - (dims.RADIUS * 0.4)}
                        rx={dims.RADIUS * 0.85}
                        ry={dims.RADIUS * 0.5}
                        fill="url(#glassReflection)"
                    />

                    {/* 2. Destello de foco (Flare) en la esquina superior izquierda */}
                    <Ellipse
                        cx={dims.CENTER - (dims.RADIUS * 0.6)}
                        cy={dims.CENTER - (dims.RADIUS * 0.6)}
                        rx={COMPASS_SIZE * 0.08}
                        ry={COMPASS_SIZE * 0.03}
                        fill="url(#flareGradient)"
                        transform={`rotate(-45, ${dims.CENTER - (dims.RADIUS * 0.6)}, ${dims.CENTER - (dims.RADIUS * 0.6)})`}
                    />
                </G>

            </Svg>
        </View>
    );
});

const styles = StyleSheet.create({
    outerContainer: { alignItems: 'center', justifyContent: 'center' }
});

export default HeadingGauge;