import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
    Circle,
    Defs,
    Ellipse,
    G, Line,
    LinearGradient,
    Path, Polygon,
    RadialGradient,
    Stop, Text as SvgText
} from 'react-native-svg';
import { GAUGE_THEME } from '../../styles/GaugeTheme';
import { describeArc, lerpAngle } from '../../utils/Utils';

const HeadingGauge = React.memo(({
    size: COMPASS_SIZE = 400,
    value = 0,
    minLayline = 20,
    maxLayline = 60,
    unit,
    headingColor,
    twd,
    twaCog,
    isNightMode,
    set = 0,
    drift = 0
}) => {
    // --- 1. ESTADO Y ANIMACIÓN ---
    const [displayHeading, setDisplayHeading] = useState(parseFloat(value) || 0);
    // Añadimos estados para los vientos:
    const [displayTwa, setDisplayTwa] = useState(twaCog || 0);
    const [displayTwd, setDisplayTwd] = useState(twd || 0);
    const [pulse, setPulse] = useState(0);
    const requestRef = useRef();



    useEffect(() => {
        const animate = (time) => {
            // Interpolación para el Rumbo
            setDisplayHeading(prev => lerpAngle(prev, parseFloat(value) || 0, 0.1));

            // Interpolación para el Viento Aparente (TWA)
            if (typeof twaCog === 'number') {
                setDisplayTwa(prev => lerpAngle(prev, twaCog, 0.1)); // 0.05 es más suave
            }

            // Interpolación para el Viento Real (TWD)
            if (typeof twd === 'number') {
                setDisplayTwd(prev => lerpAngle(prev, twd, 0.1));
            }

            if (time) setPulse((Math.sin(time / 600) + 1) / 2);
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [value, twaCog, twd]); // Añadimos los vientos a las dependencias
    // REDUNDANCIA: Hay dos useEffect muy similares que animan displayHeading y pulse. El segundo useEffect (abajo) repite parte de la lógica del primero, pero solo para displayHeading y pulse. Se podría unificar en uno solo para evitar duplicidad.


    // Eliminado useEffect redundante. La animación de displayHeading y pulse ya está cubierta por el useEffect anterior.

    // --- 2. DIMENSIONES Y CÁLCULOS ---
    const dims = useMemo(() => {
        const CENTER = COMPASS_SIZE / 2;
        const BEZEL_SIZE = COMPASS_SIZE * 0.06;
        const RADIUS = CENTER - BEZEL_SIZE;
        const INNER_RADIUS = RADIUS - (COMPASS_SIZE * 0.08);
        return {
            CENTER, RADIUS, BEZEL_SIZE, INNER_RADIUS,
            // Ajustamos el radio del texto para que entre en el círculo central
            TEXT_RAD: INNER_RADIUS - COMPASS_SIZE * 0.16,
            FONT_NUM: Math.round(COMPASS_SIZE * 0.035),
            FONT_CARD: Math.round(COMPASS_SIZE * 0.050),
            RADIUS_ARCS: RADIUS - 13
        };
    }, [COMPASS_SIZE]);

    const rotationAngle = -displayHeading;
    const finalHeadingColor = headingColor || GAUGE_THEME.colors.red;
    const formattedHeading = isNaN(parseFloat(value)) ? '---' : parseFloat(value).toFixed(0);

    return (
        <View style={[styles.outerContainer, { width: COMPASS_SIZE, height: COMPASS_SIZE }]}>
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>
                <Defs>
                    {/* Gradientes con efecto de biselado y todos los gradientes fusionados en un solo bloque */}
                    <LinearGradient id="needleSideA" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="#ff4d4d" />
                        <Stop offset="100%" stopColor="#b30000" />
                    </LinearGradient>
                    <LinearGradient id="needleSideB" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="#990000" />
                        <Stop offset="100%" stopColor="#660000" />
                    </LinearGradient>
                    <LinearGradient id="hub3D" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#888" />
                        <Stop offset="100%" stopColor="#222" />
                    </LinearGradient>
                    <LinearGradient id="needleCompass" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#ff4444" />
                        <Stop offset="50%" stopColor="#ff0000" />
                        <Stop offset="50.1%" stopColor="#cc0000" />
                        <Stop offset="100%" stopColor="#990000" />
                    </LinearGradient>
                    <LinearGradient id="needleRed" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#ff4444" /><Stop offset="50%" stopColor="#ff0000" /><Stop offset="100%" stopColor="#990000" />
                    </LinearGradient>
                    <LinearGradient id="needleBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#42a5f5" /><Stop offset="50%" stopColor="#2196f3" /><Stop offset="100%" stopColor="#0d47a1" />
                    </LinearGradient>
                    <LinearGradient id="needleOrange" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#ffb74d" /><Stop offset="50%" stopColor="#ff9800" /><Stop offset="100%" stopColor="#e65100" />
                    </LinearGradient>
                    {/* BISEL METÁLICO 3D */}
                    <LinearGradient id="bezelOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#efefef" />
                        <Stop offset="50%" stopColor="#888" />
                        <Stop offset="100%" stopColor="#444" />
                    </LinearGradient>
                    <LinearGradient id="bezelInner" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#222" />
                        <Stop offset="50%" stopColor="#444" />
                        <Stop offset="100%" stopColor="#111" />
                    </LinearGradient>
                    <LinearGradient id="bezelRidge" x1="100%" y1="100%" x2="0%" y2="0%">
                        <Stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                        <Stop offset="100%" stopColor="#666" stopOpacity="0" />
                    </LinearGradient>
                    {/* ANILLO ROJO MECANIZADO */}
                    <LinearGradient id="redMetalOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#ff4d4d" />
                        <Stop offset="100%" stopColor="#800000" />
                    </LinearGradient>
                    <LinearGradient id="redMetalInner" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#660000" />
                        <Stop offset="100%" stopColor="#330000" />
                    </LinearGradient>
                    <LinearGradient id="redMetalRidge" x1="100%" y1="100%" x2="0%" y2="0%">
                        <Stop offset="0%" stopColor="#ffcccc" stopOpacity="0.8" />
                        <Stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
                    </LinearGradient>
                    {/* Reflejo principal superior */}
                    <LinearGradient id="glassReflection" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                        <Stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
                        <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </LinearGradient>
                    {/* Destello de luz lateral (Flare) */}
                    <RadialGradient id="flareGradient" cx="50%" cy="50%" rx="50%" ry="50%">
                        <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                        <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </RadialGradient>
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

                    {/* Barco: Redimensionado para caber dentro del anillo rojo central */}
                    {/* Barco: Tamaño máximo para casi tocar el anillo rojo */}
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

                    {/* Viento Aparente (TWA) - AHORA FLUIDO */}
                    {typeof twaCog === 'number' && (
                        <G rotation={displayTwa} origin={`${dims.CENTER}, ${dims.CENTER}`}>
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

                    {/* Viento Real (TWD) - AHORA FLUIDO */}
                    {typeof twd === 'number' && (
                        <G rotation={displayTwd} origin={`${dims.CENTER}, ${dims.CENTER}`}>
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
                        {/* Triángulo de Drift (Forma Antigua: Sólido y Grande) */}
                        <Polygon
                            points={`
                ${dims.CENTER - 15},${dims.CENTER + COMPASS_SIZE * 0.15} 
                ${dims.CENTER + 15},${dims.CENTER + COMPASS_SIZE * 0.15} 
                ${dims.CENTER},${dims.CENTER + COMPASS_SIZE * 0.26}
            `}
                            fill={drift > 2.0 ? "#ffcc00" : "#00ffff"}
                            opacity={0.5 + (pulse * 0.3)}
                        />

                        {/* Texto de velocidad con NauticalFont */}
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

                {/* Puntero de Rumbo (Línea de Fe Roja) 
                <G>
                    <Polygon
                        points={`${dims.CENTER - 14},${dims.BEZEL_SIZE + 5} ${dims.CENTER + 14},${dims.BEZEL_SIZE + 5} ${dims.CENTER},${dims.BEZEL_SIZE + 35}`}
                        fill="url(#needleRed)" stroke="#fff" strokeWidth="1"
                    />
                </G>*/}



                {/* ... (aquí termina tu Capa 5 anterior) ... */}

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

                {/* --- CAPA FINAL: CRISTAL IDENTICO AL SOGGAUGE --- */}
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

            {/* Display Digital 
            <View style={styles.digitalDisplay}>
                <Text style={[styles.headingText, { color: finalHeadingColor, fontSize: dims.FONT_NUM * 2 }]}>{formattedHeading}</Text>
                <Text style={styles.unitText}>{unit || 'HDG'}</Text>
            </View>*/}
        </View>
    );
});

const styles = StyleSheet.create({
    outerContainer: { alignItems: 'center', justifyContent: 'center' },
    digitalDisplay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    headingText: { fontWeight: 'bold', fontFamily: GAUGE_THEME.fonts.main },
    unitText: { color: GAUGE_THEME.colors.textPrimary, fontSize: 14, marginTop: -5 }
});

export default HeadingGauge;