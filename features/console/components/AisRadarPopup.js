import { useEffect, useId, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Polygon, RadialGradient,
    Stop, Text as SvgText } from 'react-native-svg';
import AisTargets from '../../../components/gauges/AisTargets';
import AisRadarSweep from '../../../components/gauges/AisRadarSweep';
import AisRangeRings from '../../../components/gauges/AisRangeRings';
import { GaugeDefs } from '../../../components/gauges/shared/GaugeDefs';
import NightDimmer from '../../../components/NightDimmer';
import { useTranslation } from '../../../localization/LanguageProvider';
import { GAUGE_THEME } from '../../../styles/GaugeTheme';

const VIEWBOX_SIZE = 600;
const CENTER = VIEWBOX_SIZE / 2;
const BEZEL_SIZE = VIEWBOX_SIZE * 0.045;
const COMPASS_RADIUS = CENTER - BEZEL_SIZE;
const RADAR_RADIUS = COMPASS_RADIUS;

/** Enlarged heading-up view of the AIS layer used in the centre compass. */
export default function AisRadarPopup({ visible, onClose, targets, position, positionReceivedAt,
    connected, rangeNm, heading }) {
    const { t } = useTranslation();
    const { width, height } = useWindowDimensions();
    const mapId = useId().replace(/:/g, '');
    const [animation, setAnimation] = useState({ radarPhase: 0, targetPhase: 0 });
    useEffect(() => {
        if (!visible) return;
        let frame;
        const animate = time => {
            setAnimation({ radarPhase: (time % 4000) / 4000, targetPhase: (time % 1500) / 1500 });
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [visible]);
    const radarSize = Math.max(240, Math.min(width - 48, height - 150, 720));
    const safeHeading = Number.isFinite(heading) ? heading : 0;
    const ownShipOpacity = animation.targetPhase < 0.5 ? 1 : 0.22;
    return <Modal transparent visible={visible} animationType="fade" statusBarTranslucent
        navigationBarTranslucent onRequestClose={onClose}>
        <View style={styles.overlay}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}
                accessibilityRole="button" accessibilityLabel={t('closeAis')} />
            <View style={styles.panel} accessibilityViewIsModal>
                <View style={styles.header}>
                    <View>
                        <Text accessibilityRole="header" style={styles.title}>{t('aisRadarTitle')}</Text>
                        <Text style={styles.subtitle}>{rangeNm} NM · {Math.round(safeHeading) % 360}° T</Text>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel={t('closeAis')}
                        onPress={onClose} style={styles.close}>
                        <Text style={styles.closeText}>{t('anchorClose')}</Text>
                    </Pressable>
                </View>
                <View style={{ width: radarSize, height: radarSize, maxWidth: '100%', alignSelf: 'center' }}>
                    <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
                        <Defs>
                            <GaugeDefs idPrefix={`${mapId}-`} />
                            <LinearGradient id={`${mapId}-sea`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <Stop offset="0%" stopColor="#061923" />
                                <Stop offset="48%" stopColor="#123744" />
                                <Stop offset="100%" stopColor="#08232f" />
                            </LinearGradient>
                            <RadialGradient id={`${mapId}-glow`} cx="50%" cy="48%" r="58%">
                                <Stop offset="0%" stopColor="#2b7180" stopOpacity={0.28} />
                                <Stop offset="72%" stopColor="#0b3441" stopOpacity={0.08} />
                                <Stop offset="100%" stopColor="#020c12" stopOpacity={0.42} />
                            </RadialGradient>
                            <ClipPath id={`${mapId}-clip`}>
                                <Circle cx={CENTER} cy={CENTER} r={RADAR_RADIUS} />
                            </ClipPath>
                        </Defs>
                        <Circle cx={CENTER} cy={CENTER} r={CENTER - BEZEL_SIZE / 4} fill="none"
                            stroke={`url(#${mapId}-bezelOuter)`} strokeWidth={BEZEL_SIZE / 2} opacity={0.72} />
                        <Circle cx={CENTER} cy={CENTER} r={COMPASS_RADIUS + BEZEL_SIZE / 4} fill="none"
                            stroke={`url(#${mapId}-bezelInner)`} strokeWidth={BEZEL_SIZE / 2} opacity={0.76} />
                        <Circle cx={CENTER} cy={CENTER} r={CENTER - BEZEL_SIZE / 2} fill="none"
                            stroke={`url(#${mapId}-bezelRidge)`} strokeWidth={1.1} opacity={0.34} />
                        <Circle cx={CENTER} cy={CENTER} r={COMPASS_RADIUS} fill={GAUGE_THEME.colors.bg} />
                        <Circle cx={CENTER} cy={CENTER} r={RADAR_RADIUS} fill={`url(#${mapId}-sea)`}
                            stroke="#8fcbdc" strokeWidth={2} />
                        <G clipPath={`url(#${mapId}-clip)`} pointerEvents="none">
                            <Circle cx={CENTER} cy={CENTER} r={RADAR_RADIUS} fill={`url(#${mapId}-glow)`} />
                            {/* Decorative chart grid; it is not geographic data. */}
                            <G fill="none" stroke="#75a8b6" strokeWidth={0.8} opacity={0.16}>
                                {[120, 200, 280, 360, 440, 520].map(x =>
                                    <Path key={`v-${x}`} d={`M${x} 20 C${x - 18} 190 ${x + 18} 410 ${x} 580`} />)}
                                {[100, 180, 260, 340, 420, 500].map(y =>
                                    <Path key={`h-${y}`} d={`M20 ${y} C190 ${y + 14} 410 ${y - 14} 580 ${y}`} />)}
                            </G>
                            {/* Soft wave bands suggest water without competing with AIS symbols. */}
                            <G fill="none" stroke="#a3d4dc" strokeWidth={1.2} opacity={0.12}>
                                {[145, 205, 265, 325, 385, 445].map((y, index) =>
                                    <Path key={`wave-${y}`} d={`M35 ${y} C105 ${y - 18} 155 ${y + 18} 225 ${y}
                                        S345 ${y - 18} 415 ${y} S525 ${y + 18} 585 ${y}`} />)}
                            </G>
                            {/* Stylised coastline and depth contours. */}
                            <Path d="M18 430 C70 405 85 366 126 350 C165 335 194 355 210 392
                                C225 427 192 457 158 477 C112 505 91 548 72 590 L0 600 Z"
                                fill="#1f4d48" opacity={0.72} stroke="#79aa8e" strokeWidth={1.4} />
                            <Path d="M600 0 L482 0 C470 45 435 73 450 112 C463 145 514 140 535 177
                                C555 211 535 239 550 268 C562 290 584 296 600 300 Z"
                                fill="#204d49" opacity={0.68} stroke="#79aa8e" strokeWidth={1.4} />
                            <G fill="none" stroke="#76c2c8" strokeWidth={1.1} opacity={0.22}>
                                <Path d="M32 407 C92 377 116 324 176 326 C224 327 250 369 239 416" />
                                <Path d="M24 382 C96 346 130 294 193 302 C251 309 278 353 269 417" />
                                <Path d="M475 18 C460 66 420 93 432 137 C444 179 502 179 516 221" />
                                <Path d="M449 8 C438 58 393 91 406 145 C417 193 478 207 489 251" />
                            </G>
                        </G>
                        <AisRadarSweep center={CENTER} radius={RADAR_RADIUS} size={VIEWBOX_SIZE}
                            phase={animation.radarPhase} isNightMode={false} />
                        <AisRangeRings center={CENTER} radius={RADAR_RADIUS} size={VIEWBOX_SIZE} />
                        <SvgText x={CENTER} y={CENTER - RADAR_RADIUS + 26} textAnchor="middle"
                            fill="#eaf2f8" fontFamily="NauticalFont" fontSize={26}>{Math.round(safeHeading) % 360}°</SvgText>
                        <AisTargets targets={targets} position={position} heading={safeHeading}
                            center={CENTER} radius={RADAR_RADIUS} size={VIEWBOX_SIZE} rangeNm={rangeNm}
                            positionReceivedAt={positionReceivedAt} connected={connected}
                            animationPhase={animation.targetPhase} showLabels showCourseVector />
                        <Circle cx={CENTER} cy={CENTER} r={25} fill="#75ffd0"
                            opacity={0.12 * ownShipOpacity} />
                        <Polygon points={`${CENTER},${CENTER - 18} ${CENTER + 11},${CENTER + 15} ${CENTER},${CENTER + 9} ${CENTER - 11},${CENTER + 15}`}
                            fill="#ffffff" stroke="#10202c" strokeWidth={2} opacity={ownShipOpacity} />
                    </Svg>
                </View>
            </View>
            <NightDimmer />
        </View>
    </Modal>;
}

const styles = StyleSheet.create({
    overlay: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.78)' },
    panel: { maxWidth: '96%', maxHeight: '96%', padding: 14, borderRadius: 20,
        borderWidth: 1, borderColor: '#58788b', backgroundColor: '#10202c' },
    header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 8 },
    title: { fontFamily: 'NauticalFont', fontSize: 18, color: '#8fcbdc' },
    subtitle: { marginTop: 4, fontFamily: 'NauticalFont', fontSize: 11, color: '#9db5bf' },
    close: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 10,
        borderWidth: 1, borderColor: '#58788b' },
    closeText: { fontFamily: 'NauticalFont', fontSize: 12, color: '#8fcbdc' },
});
