import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native'; // Importación limpia
import Svg, {
    Circle,
    Defs,
    Ellipse,
    G,
    Line,
    LinearGradient,
    Path,
    Polygon,
    Rect,
    Stop,
    Text as SvgText
} from 'react-native-svg';
import { GAUGE_THEME } from '../../styles/GaugeTheme';
import { describeArc } from '../../utils/Utils';
import { GaugeDefs } from './shared/GaugeDefs';
import { computeCommonDims, polarToCartesian } from './shared/gaugeUtils';

const SogGauge = React.memo(({
    size,
    value = 0,
    maxSpeed = 12,
    isSail
}) => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const COMPASS_SIZE = size || Math.min(windowWidth * 0.9, windowHeight * 0.45);

    // DINAMISMO SEGÚN MODO
    const ACCENT_COLOR = isSail ? GAUGE_THEME.colors.sail : GAUGE_THEME.colors.engine;
    const metalId = isSail ? "blueMetal" : "redMetal";

    const [displaySog, setDisplaySog] = useState(parseFloat(value) || 0);
    const requestRef = useRef();

    useEffect(() => {
        let mounted = true;
        const animate = () => {
            setDisplaySog(prev => {
                const target = parseFloat(value) || 0;
                const diff = target - prev;
                if (Math.abs(diff) < 0.005) return target;
                return prev + diff * 0.08;
            });
            if (mounted) requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            mounted = false;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [value]);

    const dims = useMemo(() => {
        const base = computeCommonDims(COMPASS_SIZE);
        const START_ANGLE = 225;
        const TOTAL_SWEEP = 270;
        return {
            ...base,
            START_ANGLE,
            TOTAL_SWEEP,
            TEXT_RAD: base.RADIUS - COMPASS_SIZE * 0.12,
            FONT_NUM: Math.round(COMPASS_SIZE * 0.045),
            RADIUS_ARCS: base.RADIUS - 12
        };
    }, [COMPASS_SIZE]);

    const speedToAngle = (speed) => {
        return dims.START_ANGLE + (speed / maxSpeed) * dims.TOTAL_SWEEP;
    };

    const needleRotation = speedToAngle(displaySog);
    const startOfArcSpeed = 1;

    return (
        <View style={[styles.outerContainer, { width: COMPASS_SIZE, height: COMPASS_SIZE }]}>
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>
                <Defs>
                    <GaugeDefs />
                    {/* GRADIENTE DE INTENSIDAD DINÁMICO */}
                    <LinearGradient id="speedIntensityFade" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor={ACCENT_COLOR} stopOpacity="0" />
                        <Stop offset="100%" stopColor={ACCENT_COLOR} stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                {/* --- CAPA 1: BISEL Y FONDO --- */}
                <G>
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.CENTER - (dims.BEZEL_SIZE / 4)} fill="none" stroke="url(#bezelOuter)" strokeWidth={dims.BEZEL_SIZE / 2} />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.RADIUS + (dims.BEZEL_SIZE / 4)} fill="none" stroke="url(#bezelInner)" strokeWidth={dims.BEZEL_SIZE / 2} />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.RADIUS} fill={GAUGE_THEME.colors.bg} />
                </G>

                {/* --- CAPA 2: ARCO DE INTENSIDAD --- */}
                <G>
                    <Path
                        d={describeArc(
                            dims.CENTER,
                            dims.CENTER,
                            dims.RADIUS_ARCS,
                            speedToAngle(startOfArcSpeed),
                            speedToAngle(maxSpeed)
                        )}
                        fill="none"
                        stroke="url(#speedIntensityFade)"
                        strokeWidth={COMPASS_SIZE * 0.040}
                    />
                </G>

                {/* --- CAPA 3: ANILLO MECANIZADO DINÁMICO (Cian/Rojo) --- */}
                <G>
                    <Circle
                        cx={dims.CENTER} cy={dims.CENTER} r={dims.INNER_RADIUS - 35}
                        fill="none" stroke={`url(#${metalId}Outer)`} strokeWidth="5"
                    />
                    <Circle
                        cx={dims.CENTER} cy={dims.CENTER} r={dims.INNER_RADIUS - 40}
                        fill="none" stroke={`url(#${metalId}Inner)`} strokeWidth="5"
                    />
                    <Circle
                        cx={dims.CENTER} cy={dims.CENTER} r={dims.INNER_RADIUS - 37.5}
                        fill="none" stroke={`url(#${metalId}Ridge)`} strokeWidth="1" opacity={0.8}
                    />
                </G>

                {/* --- CAPA 4: ESCALA --- */}
                <G>
                    {Array.from({ length: Math.round(maxSpeed * 10) + 1 }).map((_, i) => {
                        const val = i * 0.1;
                        if (val > maxSpeed) return null;
                        const angle = speedToAngle(val);
                        const angleRad = (angle - 90) * (Math.PI / 180);

                        if (val % 1 === 0) {
                            const pos = polarToCartesian(dims.CENTER, dims.CENTER, dims.TEXT_RAD, angle);
                            return (
                                <G key={`n-${val}`}>
                                    {/* Tick principal con color de modo */}
                                    <Line
                                        x1={dims.CENTER + (dims.INNER_RADIUS + 2) * Math.cos(angleRad)}
                                        y1={dims.CENTER + (dims.INNER_RADIUS + 2) * Math.sin(angleRad)}
                                        x2={dims.CENTER + dims.RADIUS * Math.cos(angleRad)}
                                        y2={dims.CENTER + dims.RADIUS * Math.sin(angleRad)}
                                        stroke={ACCENT_COLOR}
                                        strokeWidth={2.5}
                                    />
                                    <SvgText
                                        x={pos.x} y={pos.y + (dims.FONT_NUM / 3)}
                                        textAnchor="middle" fontSize={dims.FONT_NUM}
                                        fill={GAUGE_THEME.colors.textPrimary}
                                        fontFamily="NauticalFont" fontWeight="bold"
                                    >
                                        {val}
                                    </SvgText>
                                </G>
                            );
                        }
                        if (val % 0.5 === 0) return <Line key={`h-${val}`} x1={dims.CENTER + (dims.RADIUS - 14) * Math.cos(angleRad)} y1={dims.CENTER + (dims.RADIUS - 14) * Math.sin(angleRad)} x2={dims.CENTER + dims.RADIUS * Math.cos(angleRad)} y2={dims.CENTER + dims.RADIUS * Math.sin(angleRad)} stroke={"#fff"} strokeWidth={1.5} />;
                        return <Line key={`m-${val}`} x1={dims.CENTER + (dims.RADIUS - 10) * Math.cos(angleRad)} y1={dims.CENTER + (dims.RADIUS - 10) * Math.sin(angleRad)} x2={dims.CENTER + dims.RADIUS * Math.cos(angleRad)} y2={dims.CENTER + dims.RADIUS * Math.sin(angleRad)} stroke={"rgba(255,255,255,0.4)"} strokeWidth={1} />;
                    })}
                </G>
                {/* --- CAPA 5: AGUJA CON EXTENSIÓN DE BRAZO CONTINUO --- */}
                <G rotation={needleRotation - 90} origin={`${dims.CENTER}, ${dims.CENTER}`}>

                    {/* 1. EXTENSIÓN TRASERA (Brazo rectangular continuo) */}
                    {/* Usamos dos rectángulos finos pegados para mantener el efecto de luz/sombra de la aguja */}
                    <Rect
                        x={dims.CENTER - 30}
                        y={dims.CENTER - 2.5}
                        width={30}
                        height={2.5}
                        fill="url(#needleSideA)"
                    />
                    <Rect
                        x={dims.CENTER - 30}
                        y={dims.CENTER}
                        width={30}
                        height={2.5}
                        fill="url(#needleSideB)"
                    />

                    {/* 2. CUERPO PRINCIPAL (Punta de la aguja) */}
                    <Polygon
                        points={`
            ${dims.CENTER - 1},${dims.CENTER - 4.5} 
            ${dims.CENTER + dims.RADIUS - 10},${dims.CENTER} 
            ${dims.CENTER - 1},${dims.CENTER}
        `}
                        fill="url(#needleSideA)"
                    />
                    <Polygon
                        points={`
            ${dims.CENTER - 1},${dims.CENTER} 
            ${dims.CENTER + dims.RADIUS - 10},${dims.CENTER} 
            ${dims.CENTER - 1},${dims.CENTER + 4.5}
        `}
                        fill="url(#needleSideB)"
                    />

                    {/* 3. LÍNEA DE FILO (Opcional: unifica visualmente toda la pieza) */}
                    <Line
                        x1={dims.CENTER - 30} y1={dims.CENTER}
                        x2={dims.CENTER + dims.RADIUS - 12} y2={dims.CENTER}
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="0.5"
                    />
                </G>

                {/* --- CAPA FINAL: CRISTAL Y HUB MECANIZADO --- */}
                <G pointerEvents="none">
                    {/* 1. EL FLARE (Reflejo del cristal) */}
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
                    {/* 2. EL HUB (Tapón central con tu estilo 3D) */}
                    <G pointerEvents="none">
                        {/* Sombra proyectada del tapón (para que la aguja parezca estar debajo) */}
                        <Circle
                            cx={dims.CENTER + 1.5}
                            cy={dims.CENTER + 1.5}
                            r={COMPASS_SIZE * 0.035}
                            fill="rgba(0,0,0,0.4)"
                        />
                        {/* Cuerpo del tapón */}
                        <Circle
                            cx={dims.CENTER}
                            cy={dims.CENTER}
                            r={COMPASS_SIZE * 0.032}
                            fill="url(#hub3D)"
                            stroke="#444"
                            strokeWidth="1"
                        />
                        {/* Brillo del tapón */}
                        <Circle
                            cx={dims.CENTER - (COMPASS_SIZE * 0.01)}
                            cy={dims.CENTER - (COMPASS_SIZE * 0.01)}
                            r={COMPASS_SIZE * 0.008}
                            fill="rgba(255,255,255,0.25)"
                        />
                    </G>
                </G>
            </Svg>
        </View>
    );
});

const styles = StyleSheet.create({
    outerContainer: { alignItems: 'center', justifyContent: 'center' }
});

export default SogGauge;