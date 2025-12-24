import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
    const { width: windowWidth, height: windowHeight } = require('react-native').useWindowDimensions();
    const COMPASS_SIZE = size || Math.min(windowWidth * 0.9, windowHeight * 0.45);
    const GAUGE_BG_COLOR = isSail ? GAUGE_THEME.colors.sail : GAUGE_THEME.colors.engine;
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

    // --- LÓGICA DE TERCIOS ---
    // El arco comienza a 1/3 de la velocidad máxima
    const startOfArcSpeed = 1;

    return (
        <View style={[styles.outerContainer, { width: COMPASS_SIZE, height: COMPASS_SIZE }]}>
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>
                <Defs>
                    <GaugeDefs />
                    {/* GRADIENTE INVERSO: Invisible (0%) -> Sólido (100%) */}
                    <LinearGradient id="speedIntensityFade" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor={GAUGE_BG_COLOR} stopOpacity="0" />
                        <Stop offset="100%" stopColor={GAUGE_BG_COLOR} stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                {/* --- CAPA 1: BISEL Y FONDO --- */}
                <G>
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.CENTER - (dims.BEZEL_SIZE / 4)} fill="none" stroke="url(#bezelOuter)" strokeWidth={dims.BEZEL_SIZE / 2} />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.RADIUS + (dims.BEZEL_SIZE / 4)} fill="none" stroke="url(#bezelInner)" strokeWidth={dims.BEZEL_SIZE / 2} />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.RADIUS} fill={GAUGE_THEME.colors.bg} />
                </G>

                {/* --- CAPA 2: ARCO DE INTENSIDAD CRECIENTE --- */}
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

                {/* --- CAPA 3: ANILLO ROJO 3D --- */}
                <G>
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.INNER_RADIUS - 35} fill="none" stroke="url(#redMetalOuter)" strokeWidth="5" />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.INNER_RADIUS - 40} fill="none" stroke="url(#redMetalInner)" strokeWidth="5" />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.INNER_RADIUS - 37.5} fill="none" stroke="url(#redMetalRidge)" strokeWidth="1" opacity={0.8} />
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
                                    <Line x1={dims.CENTER + (dims.INNER_RADIUS + 2) * Math.cos(angleRad)} y1={dims.CENTER + (dims.INNER_RADIUS + 2) * Math.sin(angleRad)} x2={dims.CENTER + dims.RADIUS * Math.cos(angleRad)} y2={dims.CENTER + dims.RADIUS * Math.sin(angleRad)} stroke={GAUGE_THEME.colors.engine} strokeWidth={2.5} />
                                    <SvgText x={pos.x} y={pos.y + (dims.FONT_NUM / 3)} textAnchor="middle" fontSize={dims.FONT_NUM} fill={GAUGE_THEME.colors.textPrimary} fontFamily="NauticalFont" fontWeight="bold">{val}</SvgText>
                                </G>
                            );
                        }
                        if (val % 0.5 === 0) return <Line key={`h-${val}`} x1={dims.CENTER + (dims.RADIUS - 14) * Math.cos(angleRad)} y1={dims.CENTER + (dims.RADIUS - 14) * Math.sin(angleRad)} x2={dims.CENTER + dims.RADIUS * Math.cos(angleRad)} y2={dims.CENTER + dims.RADIUS * Math.sin(angleRad)} stroke={"#fff"} strokeWidth={1.5} />;
                        return <Line key={`m-${val}`} x1={dims.CENTER + (dims.RADIUS - 10) * Math.cos(angleRad)} y1={dims.CENTER + (dims.RADIUS - 10) * Math.sin(angleRad)} x2={dims.CENTER + dims.RADIUS * Math.cos(angleRad)} y2={dims.CENTER + dims.RADIUS * Math.sin(angleRad)} stroke={"rgba(255,255,255,0.4)"} strokeWidth={1} />;
                    })}
                </G>

                {/* --- CAPA 5: AGUJA --- */}
                <G rotation={needleRotation - 90} origin={`${dims.CENTER}, ${dims.CENTER}`}>
                    <Rect x={dims.CENTER - 20} y={dims.CENTER - 1.5} width={25} height={3} fill="#333" rx={1} />
                    <Polygon points={`${dims.CENTER},${dims.CENTER - 4.5} ${dims.CENTER + dims.RADIUS - 10},${dims.CENTER} ${dims.CENTER},${dims.CENTER}`} fill="url(#needleSideA)" />
                    <Polygon points={`${dims.CENTER},${dims.CENTER} ${dims.CENTER + dims.RADIUS - 10},${dims.CENTER} ${dims.CENTER},${dims.CENTER + 4.5}`} fill="url(#needleSideB)" />
                </G>

                {/* --- CAPA FINAL: CRISTAL --- */}
                <G pointerEvents="none">
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={11} fill="url(#hub3D)" stroke="#444" strokeWidth="1" />
                    <Ellipse cx={dims.CENTER} cy={dims.CENTER - (dims.RADIUS * 0.4)} rx={dims.RADIUS * 0.85} ry={dims.RADIUS * 0.5} fill="url(#glassReflection)" />
                </G>
            </Svg>
        </View>
    );
});

const styles = StyleSheet.create({
    outerContainer: { alignItems: 'center', justifyContent: 'center' }
});

export default SogGauge;