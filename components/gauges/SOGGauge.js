import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
    Circle,
    Defs,
    Ellipse,
    G,
    Line,
    Polygon,
    Rect,
    Text as SvgText
} from 'react-native-svg';
import { GAUGE_THEME } from '../../styles/GaugeTheme';
import { GaugeDefs } from './shared/GaugeDefs';
import { computeCommonDims, polarToCartesian } from './shared/gaugeUtils';

const SogGauge = React.memo(({
    size: COMPASS_SIZE = 400,
    value = 0,
    maxSpeed = 10
}) => {
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

    // polarToCartesian ahora importado desde helpers compartidos

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
        };
    }, [COMPASS_SIZE]);

    const labels = useMemo(() => {
        const max = Math.ceil(maxSpeed);
        return Array.from({ length: max + 1 }, (_, i) => i);
    }, [maxSpeed]);

    const needleRotation = dims.START_ANGLE + (displaySog / maxSpeed) * dims.TOTAL_SWEEP;

    return (
        <View style={[styles.outerContainer, { width: COMPASS_SIZE, height: COMPASS_SIZE }]}>
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>
                <Defs>
                    <GaugeDefs />
                </Defs>

                {/* --- CAPA 1: BISEL MECANIZADO --- */}
                <G>
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.CENTER - (dims.BEZEL_SIZE / 4)} fill="none" stroke="url(#bezelOuter)" strokeWidth={dims.BEZEL_SIZE / 2} />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.RADIUS + (dims.BEZEL_SIZE / 4)} fill="none" stroke="url(#bezelInner)" strokeWidth={dims.BEZEL_SIZE / 2} />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.CENTER - (dims.BEZEL_SIZE / 2)} fill="none" stroke="url(#bezelRidge)" strokeWidth="1.5" opacity={0.6} />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.RADIUS} fill={GAUGE_THEME.colors.bg} stroke="#000" strokeWidth="2" />
                </G>


                {/* --- CAPA 2: ANILLO ROJO MECANIZADO 3D (SUSTITUCIÓN) --- */}
                <G>
                    {/* Cara exterior (subida) */}
                    <Circle
                        cx={dims.CENTER} cy={dims.CENTER}
                        r={dims.INNER_RADIUS - 35}
                        fill="none"
                        stroke="url(#redMetalOuter)"
                        strokeWidth="5"
                    />

                    {/* Cara interior (bajada) */}
                    <Circle
                        cx={dims.CENTER} cy={dims.CENTER}
                        r={dims.INNER_RADIUS - 40}
                        fill="none"
                        stroke="url(#redMetalInner)"
                        strokeWidth="5"
                    />

                    {/* Arista de brillo central (el "filo" metálico) */}
                    <Circle
                        cx={dims.CENTER} cy={dims.CENTER}
                        r={dims.INNER_RADIUS - 37.5}
                        fill="none"
                        stroke="url(#redMetalRidge)"
                        strokeWidth="1"
                        opacity={0.8}
                    />

                    {/* Sombra de profundidad interior */}
                    <Circle
                        cx={dims.CENTER} cy={dims.CENTER}
                        r={dims.INNER_RADIUS - 43}
                        fill="none"
                        stroke="#000"
                        strokeWidth="1.5"
                        opacity={0.4}
                    />
                </G>

                {/* --- CAPA 3: TICKS Y NÚMEROS --- */}
                <G>
                    {/* Ticks menores cada 0.2 nudos y mayores cada 10 nudos */}
                    {Array.from({ length: Math.round(maxSpeed * 5) + 1 }).map((_, i) => {
                        const val = i * 0.2;
                        if (val > maxSpeed) return null;
                        const angle = dims.START_ANGLE + (val / maxSpeed) * dims.TOTAL_SWEEP;
                        const angleRad = (angle - 90) * (Math.PI / 180);
                        // Ticks mayores cada 10
                        if (val % 10 === 0) {
                            return (
                                <Line
                                    key={`tick-major-${val}`}
                                    x1={dims.CENTER + (dims.RADIUS - 18) * Math.cos(angleRad)}
                                    y1={dims.CENTER + (dims.RADIUS - 18) * Math.sin(angleRad)}
                                    x2={dims.CENTER + dims.RADIUS * Math.cos(angleRad)}
                                    y2={dims.CENTER + dims.RADIUS * Math.sin(angleRad)}
                                    stroke={GAUGE_THEME.colors.red}
                                    strokeWidth={3}
                                />
                            );
                        }
                        // Ticks menores cada 0.2
                        return (
                            <Line
                                key={`tick-minor-${val}`}
                                x1={dims.CENTER + (dims.RADIUS - 10) * Math.cos(angleRad)}
                                y1={dims.CENTER + (dims.RADIUS - 10) * Math.sin(angleRad)}
                                x2={dims.CENTER + dims.RADIUS * Math.cos(angleRad)}
                                y2={dims.CENTER + dims.RADIUS * Math.sin(angleRad)}
                                stroke={"rgba(255,255,255,0.4)"}
                                strokeWidth={1}
                            />
                        );
                    })}

                    {/* Ticks Rojos y Números */}
                    {labels.map((val) => {
                        const angle = dims.START_ANGLE + (val / maxSpeed) * dims.TOTAL_SWEEP;
                        const angleRad = (angle - 90) * (Math.PI / 180);
                        const pos = polarToCartesian(dims.CENTER, dims.CENTER, dims.TEXT_RAD, angle);
                        return (
                            <G key={`label-${val}`}>
                                <Line
                                    x1={dims.CENTER + (dims.INNER_RADIUS + 2) * Math.cos(angleRad)}
                                    y1={dims.CENTER + (dims.INNER_RADIUS + 2) * Math.sin(angleRad)}
                                    x2={dims.CENTER + dims.RADIUS * Math.cos(angleRad)}
                                    y2={dims.CENTER + dims.RADIUS * Math.sin(angleRad)}
                                    stroke={GAUGE_THEME.colors.red}
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
                    })}
                </G>

                {/* --- CAPA 4: AGUJA PRO 3D --- */}
                <G rotation={needleRotation - 90} origin={`${dims.CENTER}, ${dims.CENTER}`}>
                    <Rect x={dims.CENTER - 20} y={dims.CENTER - 1.5} width={25} height={3} fill="#333" rx={1} />
                    <Polygon points={`${dims.CENTER},${dims.CENTER - 4.5} ${dims.CENTER + dims.RADIUS - 10},${dims.CENTER} ${dims.CENTER},${dims.CENTER}`} fill="url(#needleSideA)" />
                    <Polygon points={`${dims.CENTER},${dims.CENTER} ${dims.CENTER + dims.RADIUS - 10},${dims.CENTER} ${dims.CENTER},${dims.CENTER + 4.5}`} fill="url(#needleSideB)" />
                    <Line x1={dims.CENTER + dims.RADIUS - 15} y1={dims.CENTER} x2={dims.CENTER + dims.RADIUS - 10} y2={dims.CENTER} stroke="#fff" strokeWidth="1" />
                </G>

                {/* --- CAPA 5: HUB CENTRAL --- */}
                <G>
                    <Circle cx={dims.CENTER + 1} cy={dims.CENTER + 1} r={12} fill="rgba(0,0,0,0.4)" />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={11} fill="url(#hub3D)" stroke="#444" strokeWidth="1" />
                    <Circle cx={dims.CENTER - 3} cy={dims.CENTER - 3} r={3} fill="rgba(255,255,255,0.2)" />
                </G>

                {/* --- CAPA FINAL: CRISTAL Y DESTELLO --- */}
                <G pointerEvents="none">
                    <Ellipse cx={dims.CENTER} cy={dims.CENTER - (dims.RADIUS * 0.4)} rx={dims.RADIUS * 0.85} ry={dims.RADIUS * 0.5} fill="url(#glassReflection)" />
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

export default SogGauge;