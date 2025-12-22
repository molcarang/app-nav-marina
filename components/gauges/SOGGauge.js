import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { GAUGE_THEME } from '../../styles/GaugeTheme';
import { polarToCartesian } from '../../utils/Utils';

const SogGauge = React.memo(({
    size: COMPASS_SIZE = 400,
    value = 0,
    maxSpeed = 10,
    headingColor = GAUGE_THEME.colors.red
}) => {
    // 1. Hooks de estado y refs siempre al principio
    const [displaySog, setDisplaySog] = useState(0);
    const targetSog = useRef(0);
    const requestRef = useRef();

    // 2. Sincronización del valor objetivo
    useEffect(() => {
        targetSog.current = parseFloat(value) || 0;
    }, [value]);

    // 3. Definición de la función de animación
    const animate = () => {
        setDisplaySog(prev => {
            const diff = targetSog.current - prev;
            if (Math.abs(diff) < 0.005) return targetSog.current;
            return prev + diff * 0.08;
        });
        requestRef.current = requestAnimationFrame(animate);
    };

    // 4. Hook para iniciar/limpiar la animación
    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // 5. Cálculos de dibujo
    const dims = useMemo(() => {
        const CENTER = COMPASS_SIZE / 2;
        const RADIUS = CENTER - COMPASS_SIZE * 0.036;
        const INNER_RADIUS = RADIUS - COMPASS_SIZE * 0.1;
        const START_ANGLE = 225;
        const TOTAL_SWEEP = 270;

        return {
            CENTER, RADIUS, INNER_RADIUS, START_ANGLE, TOTAL_SWEEP,
            TEXT_RAD: RADIUS - COMPASS_SIZE * 0.11,
            FONT_NUM: Math.round(COMPASS_SIZE * 0.032),
            FONT_MAIN: Math.round(COMPASS_SIZE * 0.087),
        };
    }, [COMPASS_SIZE]);

    const labels = useMemo(() => {
        const max = Math.ceil(maxSpeed);
        const items = [];
        for (let i = 0; i <= max; i++) items.push(i);
        return items;
    }, [maxSpeed]);

    const subTicks = useMemo(() => {
        const ticks = [];
        const max = Math.ceil(maxSpeed);
        for (let i = 0; i <= max; i = parseFloat((i + 0.1).toFixed(1))) {
            if (!Number.isInteger(i)) ticks.push(i);
        }
        return ticks;
    }, [maxSpeed]);

    const needleRotation = dims.START_ANGLE + (displaySog / maxSpeed) * dims.TOTAL_SWEEP;

    return (
        <View style={[styles.outerContainer, { width: COMPASS_SIZE, height: COMPASS_SIZE }]}>
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>
                <G>
                    <Circle
                        cx={dims.CENTER} cy={dims.CENTER} r={dims.RADIUS}
                        fill={GAUGE_THEME.colors.bg}
                        stroke={GAUGE_THEME.colors.border}
                        strokeWidth={GAUGE_THEME.strokeWidths.outerBorder}
                    />
                    <Circle
                        cx={dims.CENTER} cy={dims.CENTER} r={dims.INNER_RADIUS - 25}
                        fill="transparent"
                        stroke={GAUGE_THEME.colors.border}
                        strokeWidth={GAUGE_THEME.strokeWidths.innerCircle}
                        opacity={GAUGE_THEME.opacities.innerCircle}
                    />

                    {subTicks.map((val) => {
                        const angle = dims.START_ANGLE + (val / maxSpeed) * dims.TOTAL_SWEEP;
                        const angleRad = (angle - 90) * (Math.PI / 180);
                        const isHalf = (val * 10) % 5 === 0;
                        const innerTick = dims.INNER_RADIUS + (isHalf ? COMPASS_SIZE * 0.045 : COMPASS_SIZE * 0.05);
                        return (
                            <Line
                                key={`sub-${val}`}
                                x1={dims.CENTER + innerTick * Math.cos(angleRad)}
                                y1={dims.CENTER + innerTick * Math.sin(angleRad)}
                                x2={dims.CENTER + dims.RADIUS * Math.cos(angleRad)}
                                y2={dims.CENTER + dims.RADIUS * Math.sin(angleRad)}
                                stroke={GAUGE_THEME.colors.border}
                                strokeWidth={isHalf ? 1.5 : GAUGE_THEME.strokeWidths.minorTick}
                                opacity={isHalf ? GAUGE_THEME.opacities.halfTick : GAUGE_THEME.opacities.minorTick}
                            />
                        );
                    })}

                    {labels.map((val) => {
                        const angle = dims.START_ANGLE + (val / maxSpeed) * dims.TOTAL_SWEEP;
                        const pos = polarToCartesian(dims.CENTER, dims.CENTER, dims.TEXT_RAD, angle);
                        const angleRad = (angle - 90) * (Math.PI / 180);
                        return (
                            <G key={`mark-${val}`}>
                                <Line
                                    x1={dims.CENTER + (dims.INNER_RADIUS + COMPASS_SIZE * 0.027) * Math.cos(angleRad)}
                                    y1={dims.CENTER + (dims.INNER_RADIUS + COMPASS_SIZE * 0.027) * Math.sin(angleRad)}
                                    x2={dims.CENTER + dims.RADIUS * Math.cos(angleRad)}
                                    y2={dims.CENTER + dims.RADIUS * Math.sin(angleRad)}
                                    stroke={GAUGE_THEME.colors.red}
                                    strokeWidth={GAUGE_THEME.strokeWidths.majorTick}
                                />
                                <SvgText
                                    x={pos.x} y={pos.y + (dims.FONT_NUM / 3)}
                                    textAnchor="middle" fontSize={dims.FONT_NUM}
                                    fill={GAUGE_THEME.colors.textPrimary}
                                    fontFamily={GAUGE_THEME.fonts.main}
                                >
                                    {val}
                                </SvgText>
                            </G>
                        );
                    })}
                </G>

                <G rotation={needleRotation - 90} origin={`${dims.CENTER}, ${dims.CENTER}`}>
                    <Polygon
                        points={`${dims.CENTER},${dims.CENTER - 8} ${dims.CENTER + dims.RADIUS - 10},${dims.CENTER} ${dims.CENTER},${dims.CENTER + 8}`}
                        fill={GAUGE_THEME.colors.red}
                        stroke={GAUGE_THEME.colors.border}
                        strokeWidth={GAUGE_THEME.strokeWidths.needleStroke}
                    />
                </G>

                <Circle cx={dims.CENTER} cy={dims.CENTER} r={12} fill={GAUGE_THEME.colors.centerHub} stroke={GAUGE_THEME.colors.border} strokeWidth="2" />
            </Svg>

            <View style={[styles.digitalDisplay, { top: dims.CENTER - COMPASS_SIZE * 0.05 }]}>
                <Text style={[styles.headingText, { color: headingColor, fontSize: dims.FONT_MAIN }]}>
                    {displaySog.toFixed(1)}
                </Text>
                <Text style={styles.unitText}>SOG KTS (MAX: {maxSpeed})</Text>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    outerContainer: { alignItems: 'center', justifyContent: 'center' },
    digitalDisplay: { position: 'absolute', alignItems: 'center' },
    headingText: { fontWeight: 'bold', fontFamily: GAUGE_THEME.fonts.main },
    unitText: { color: GAUGE_THEME.colors.textPrimary, fontSize: 13, marginTop: -5, fontFamily: GAUGE_THEME.fonts.main },
});

export default SogGauge;