import { useTranslation } from '../../localization/LanguageProvider';
// --- LIBRERÍAS Y COMPONENTES ---
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
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
import SteelBall from './SteelBall';
import GaugeSailboat from './GaugeSailboat';
import AisRangeRings from './AisRangeRings';
import AisTargets from './AisTargets';
import AisVesselPopup from './AisVesselPopup';
import AisTouchOverlay from './AisTouchOverlay';

const HeadingGauge = React.memo(({
    size,
    showAis = true,
    aisTargets,
    position,
    positionReceivedAt,
    isConnected,
    value = 0,
    minLayline = 20,
    maxLayline = 60,
    awa = 0, // Recuperado
    twd,
    awsKnots = 0,
    twsKnots = 0,
    twaCog,
    isNightMode,
    set = 0,
    drift = 0
}) => {
    const { t } = useTranslation();
    const { width: windowWidth, height: windowHeight } = require('react-native').useWindowDimensions();
    const COMPASS_SIZE = size || Math.min(windowWidth * 0.9, windowHeight * 0.45);
        const [display, setDisplay] = useState({
        heading: parseFloat(value) || 0,
        twa: twaCog || 0,
        awa: awa || 0, // Recuperado
        twd: twd || 0,
        currentFlow: 0
    });
    const requestRef = useRef();
    const [selectedVessel, setSelectedVessel] = useState(null);
    useEffect(() => {
        if (!selectedVessel) return;
        const timeout = setTimeout(() => setSelectedVessel(null), 3000);
        return () => clearTimeout(timeout);
    }, [selectedVessel]);
    useEffect(() => {
        if (!showAis || !isConnected) setSelectedVessel(null);
    }, [showAis, isConnected]);

    useEffect(() => {
        let mounted = true;
        const animate = (time) => {
            setDisplay(prev => {
                const nextHeading = lerpAngle(prev.heading, parseFloat(value) || 0, 0.1);
                const nextTwa = typeof twaCog === 'number' ? lerpAngle(prev.twa, twaCog, 0.1) : prev.twa;
                const nextAwa = typeof awa === 'number' ? lerpAngle(prev.awa, awa, 0.1) : prev.awa;
                const nextTwd = typeof twd === 'number' ? lerpAngle(prev.twd, twd, 0.1) : prev.twd;
                const nextFlow = Number.isFinite(time) ? (time % 1500) / 1500 : prev.currentFlow;
                
                if (
                    Math.abs(nextHeading - prev.heading) > 0.01 ||
                    Math.abs(nextTwa - prev.twa) > 0.01 ||
                    Math.abs(nextAwa - prev.awa) > 0.01 ||
                    Math.abs(nextTwd - prev.twd) > 0.01 ||
                    Math.abs(nextFlow - prev.currentFlow) > 0.01
                ) {
                    return { heading: nextHeading, twa: nextTwa, awa: nextAwa, twd: nextTwd, currentFlow: nextFlow };
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
    }, [value, twaCog, awa, twd]);

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
    // Margen exterior para que las flechas giren fuera del bisel sin recortarse.
    const windMargin = COMPASS_SIZE * 0.11;
    const windBaseY = -windMargin + 3;
    const windTipY = -3;
    const windHalfWidth = COMPASS_SIZE * 0.055;
    // El tamaño máximo coincide con el actual y se alcanza a 30 kn.
    const windMarker = speed => {
        const ratio = Math.min(1, Math.max(0, Number.isFinite(speed) ? speed / 30 : 0));
        const scale = 0.45 + ratio * 0.55;
        const baseY = windTipY + (windBaseY - windTipY) * scale;
        return {
            points: `${dims.CENTER - windHalfWidth * scale},${baseY} ${dims.CENTER + windHalfWidth * scale},${baseY} ${dims.CENTER},${windTipY}`,
            labelY: baseY + COMPASS_SIZE * 0.044 * scale,
            fontSize: COMPASS_SIZE * 0.037 * scale,
        };
    };
    // Una escala común mantiene iguales las flechas A y T, incluidas sus letras.
    const sharedWindSpeed = Math.max(
        Number.isFinite(awsKnots) ? awsKnots : 0,
        Number.isFinite(twsKnots) ? twsKnots : 0,
    );
    const apparentMarker = windMarker(sharedWindSpeed);
    const trueMarker = apparentMarker;
    // A 5 kn alcanza su longitud máxima, dejando margen al borde interior rojo.
    const currentMaxRadius = Math.max(0, dims.INNER_RADIUS - 39 - 4);
    const currentRatio = Math.min(1, Math.max(0, Number.isFinite(drift) ? drift / 5 : 0));
    const currentLength = currentMaxRadius * (0.35 + currentRatio * 0.65);
    const currentShaftLength = currentLength * 0.64;
    const currentChevronWidth = Math.min(COMPASS_SIZE * 0.061875, currentMaxRadius * 0.24);
    const currentChevronStep = (currentLength + currentShaftLength) / 6.3;
    const currentLabelRadius = currentShaftLength + COMPASS_SIZE * 0.09;

    return (
        <View style={[styles.outerContainer, { width: COMPASS_SIZE, height: COMPASS_SIZE }]}>
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`${-windMargin} ${-windMargin} ${COMPASS_SIZE + windMargin * 2} ${COMPASS_SIZE + windMargin * 2}`}>
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

                {showAis && <AisRangeRings center={dims.CENTER} radius={currentMaxRadius * 0.9} size={COMPASS_SIZE} />}

                {/* --- CAPA 2: ELEMENTOS ESTÁTICOS (BARCO Y LAYLINES) --- */}
                <G>
                    <Path
                        d={describeArc(dims.CENTER, dims.CENTER, dims.RADIUS_ARCS, minLayline, maxLayline)}
                        fill="none" stroke="#00ff00" strokeWidth={COMPASS_SIZE * 0.07} strokeLinecap="butt" opacity={0.5}
                    />
                    <Path
                        d={describeArc(dims.CENTER, dims.CENTER, dims.RADIUS_ARCS, 360 - maxLayline, 360 - minLayline)}
                        fill="none" stroke="#ff0000" strokeWidth={COMPASS_SIZE * 0.07} strokeLinecap="butt" opacity={0.5}
                    />

                    <GaugeSailboat center={dims.CENTER} size={COMPASS_SIZE} isNightMode={isNightMode} showAis={showAis} />
                </G>

                {/* --- CAPA 3: DIAL ROTATIVO --- */}
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
                                    stroke={isMajor ? GAUGE_THEME.colors.engine : (isMid ? "#fff" : "rgba(255,255,255,0.4)")}
                                    strokeWidth={isMajor ? 3 : 1.5}
                                />
                                {isMajor && (
                                    <G>
                                        <G rotation={-rotationAngle} origin={`${dims.CENTER + degreeRad * Math.cos(angleRad)}, ${dims.CENTER + degreeRad * Math.sin(angleRad)}`}>
                                            <SvgText x={dims.CENTER + degreeRad * Math.cos(angleRad)} y={dims.CENTER + degreeRad * Math.sin(angleRad) + 5} fill="white" fontSize={dims.FONT_NUM} textAnchor="middle" fontFamily="NauticalFont">{deg}</SvgText>
                                        </G>
                                        {(deg % 90 === 0) && (
                                            <G rotation={-rotationAngle} origin={`${dims.CENTER + cardinalRad * Math.cos(angleRad)}, ${dims.CENTER + cardinalRad * Math.sin(angleRad)}`}>
                                                <SvgText x={dims.CENTER + cardinalRad * Math.cos(angleRad)} y={dims.CENTER + cardinalRad * Math.sin(angleRad) + 5} fill={GAUGE_THEME.colors.engine} fontSize={dims.FONT_CARD} textAnchor="middle" fontFamily="NauticalFont">{deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? t('west') : ''}</SvgText>
                                            </G>
                                        )}
                                    </G>
                                )}
                            </G>
                        );
                    })}
                </G>

                {/* --- CAPA 4: AGUJAS DE VIENTO (REFERENCIA PROA) --- */}

                {/* Viento Aparente (AWA) - AZUL */}
                {typeof awa === 'number' && (
                    <G rotation={display.awa} origin={`${dims.CENTER}, ${dims.CENTER}`}>
                        <Line x1={dims.CENTER} y1={dims.CENTER} x2={dims.CENTER} y2={windTipY} stroke="#2196f3" strokeWidth="2" strokeDasharray="5, 3" opacity={0.8} />
                        <Polygon points={apparentMarker.points} fill="url(#needleBlue)" stroke="#fff" strokeWidth="1" />
                        <SvgText x={dims.CENTER} y={apparentMarker.labelY} fill="white" fontSize={apparentMarker.fontSize} fontWeight="bold" textAnchor="middle" fontFamily="NauticalFont">A</SvgText>
                    </G>
                )}

                {/* Viento Real (TWA) - NARANJA */}
                {typeof twaCog === 'number' && (
                    <G rotation={display.twa} origin={`${dims.CENTER}, ${dims.CENTER}`}>
                        <Line x1={dims.CENTER} y1={dims.CENTER} x2={dims.CENTER} y2={windTipY} stroke="#ff9800" strokeWidth="2" strokeDasharray="5, 3" opacity={0.8} />
                        <Polygon points={trueMarker.points} fill="url(#needleOrange)" stroke="#fff" strokeWidth="1" />
                        <SvgText x={dims.CENTER} y={trueMarker.labelY} fill="white"
                        fontSize={trueMarker.fontSize} fontWeight="bold" textAnchor="middle" fontFamily="NauticalFont">{t('trueWindInitial')}</SvgText>
                    </G>
                )}

                {/* --- CAPA 5: ANILLO ROJO --- */}
                <G>
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.INNER_RADIUS - 30} fill="none" stroke="url(#redMetalOuter)" strokeWidth="6" />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.INNER_RADIUS - 36} fill="none" stroke="url(#redMetalInner)" strokeWidth="6" />
                    <Circle cx={dims.CENTER} cy={dims.CENTER} r={dims.INNER_RADIUS - 33} fill="none" stroke="url(#redMetalRidge)" strokeWidth="1.5" opacity={0.8} />
                </G>

                {/* --- CAPA 6: CORRIENTE --- */}
                {drift > 0.1 && (
                    <G rotation={rotationAngle + set} origin={`${dims.CENTER}, ${dims.CENTER}`}>
                        <G opacity={isNightMode ? 0.55 : 1}>
                            {Array.from({ length: 6 }, (_, index) => {
                                const back = dims.CENTER - currentShaftLength + index * currentChevronStep;
                                const bend = currentChevronStep * 0.6;
                                const thickness = currentChevronStep * 0.7;
                                // La cresta de brillo recorre los chevrones desde la cola hasta la punta.
                                const wave = (1 + Math.cos(2 * Math.PI * (index / 6 - display.currentFlow))) / 2;
                                return (
                                    <Polygon
                                        key={`current-chevron-${index}`}
                                        points={`${dims.CENTER - currentChevronWidth},${back} ${dims.CENTER},${back + bend} ${dims.CENTER + currentChevronWidth},${back} ${dims.CENTER + currentChevronWidth},${back + thickness} ${dims.CENTER},${back + bend + thickness} ${dims.CENTER - currentChevronWidth},${back + thickness}`}
                                        fill={drift > 2.0 ? '#ffcc00' : '#00ffff'}
                                        opacity={0.25 + 0.75 * wave * wave}
                                    />
                                );
                            })}
                        </G>
                    </G>
                )}

                {/* --- AGUJA DE COMPÁS PROFESIONAL 3D --- */}
                <G pointerEvents="none">
                    <Polygon points={`${dims.CENTER},${dims.CENTER - (COMPASS_SIZE * 0.25)} ${dims.CENTER - 10},${dims.CENTER} ${dims.CENTER},${dims.CENTER}`} fill="url(#needleSideA)" />
                    <Polygon points={`${dims.CENTER},${dims.CENTER - (COMPASS_SIZE * 0.25)} ${dims.CENTER + 10},${dims.CENTER} ${dims.CENTER},${dims.CENTER}`} fill="url(#needleSideB)" />
                    <Polygon points={`${dims.CENTER},${dims.CENTER + (COMPASS_SIZE * 0.25)} ${dims.CENTER - 10},${dims.CENTER} ${dims.CENTER},${dims.CENTER}`} fill="#e0e0e0" />
                    <Polygon points={`${dims.CENTER},${dims.CENTER + (COMPASS_SIZE * 0.25)} ${dims.CENTER + 10},${dims.CENTER} ${dims.CENTER},${dims.CENTER}`} fill="#9e9e9e" />
                    <Polygon points={`${dims.CENTER},${dims.CENTER - (COMPASS_SIZE * 0.25)} ${dims.CENTER + 10},${dims.CENTER} ${dims.CENTER},${dims.CENTER + (COMPASS_SIZE * 0.25)} ${dims.CENTER - 10},${dims.CENTER}`} fill="none" stroke="#fff" strokeWidth="0.5" opacity={0.6} />
                </G>

                {/* Lectura tras la cola: acompaña a la flecha, pero permanece horizontal. */}
                {drift > 0.1 && (
                    <G rotation={rotationAngle + set} origin={`${dims.CENTER}, ${dims.CENTER}`}>
                        <G rotation={-(rotationAngle + set)} origin={`${dims.CENTER}, ${dims.CENTER - currentLabelRadius}`}>
                            <SvgText
                                x={dims.CENTER} y={dims.CENTER - currentLabelRadius + COMPASS_SIZE * 0.008}
                                fill="#ffffff"
                                fontSize={COMPASS_SIZE * 0.025} fontWeight="normal"
                                textAnchor="middle" fontFamily="NauticalFont"
                            >{drift.toFixed(1)} kn</SvgText>
                        </G>
                    </G>
                )}
                {showAis && <AisTargets targets={aisTargets} position={position} heading={display.heading}
                    animationPhase={display.currentFlow}
                    onSelect={Platform.OS === 'web' ? setSelectedVessel : undefined}
                    center={dims.CENTER} radius={currentMaxRadius * 0.9} size={COMPASS_SIZE}
                    positionReceivedAt={positionReceivedAt} connected={isConnected} />}
                <SteelBall cx={dims.CENTER} cy={dims.CENTER} isNightMode={isNightMode} />

                {/* --- CRISTAL --- */}
                <G pointerEvents="none">
                    <Ellipse cx={dims.CENTER} cy={dims.CENTER - (dims.RADIUS * 0.4)} rx={dims.RADIUS * 0.85} ry={dims.RADIUS * 0.5} fill="url(#glassReflection)" />
                    <Ellipse cx={dims.CENTER - (dims.RADIUS * 0.6)} cy={dims.CENTER - (dims.RADIUS * 0.6)} rx={COMPASS_SIZE * 0.08} ry={COMPASS_SIZE * 0.03} fill="url(#flareGradient)" transform={`rotate(-45, ${dims.CENTER - (dims.RADIUS * 0.6)}, ${dims.CENTER - (dims.RADIUS * 0.6)})`} />
                </G>

            </Svg>
            {showAis && Platform.OS !== 'web' && <AisTouchOverlay targets={aisTargets}
                position={position} heading={display.heading} center={dims.CENTER}
                radius={currentMaxRadius * 0.9} size={COMPASS_SIZE}
                positionReceivedAt={positionReceivedAt} connected={isConnected} onSelect={setSelectedVessel} />}
            <AisVesselPopup vessel={showAis && isConnected ? selectedVessel : null} onClose={() => setSelectedVessel(null)} />
        </View>
    );
});

const styles = StyleSheet.create({
    outerContainer: { alignItems: 'center', justifyContent: 'center' }
});

HeadingGauge.displayName = 'HeadingGauge';
export default HeadingGauge;
