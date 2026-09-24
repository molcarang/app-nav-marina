import { useTranslation } from '../../localization/LanguageProvider';
import { useEffect, useId, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, LinearGradient, Rect, Stop, Text } from 'react-native-svg';
import { cardinalHeading, compassTicks, normalizeHeading } from './shared/compassRibbon.js';

/** Cinta de rumbo: la escala se desplaza bajo una marca central fija. */
export default function HorizontalCompass({ heading, isConnected, isNightMode }) {
    const { t } = useTranslation();
    const clipId = `compass-ribbon-${useId().replace(/:/g, '')}`;
    const glassId = `${clipId}-glass`;
    const frameId = `${clipId}-frame`;
    const shadeId = `${clipId}-shade`;
    const valid = isConnected && Number.isFinite(heading);
    const degrees = valid ? normalizeHeading(heading) : 0;
    const [wheelHeading, setWheelHeading] = useState(degrees);
    const wheelRef = useRef(degrees);
    const initialized = useRef(false);
    useEffect(() => {
        if (!valid) {
            initialized.current = false;
            return;
        }
        if (!initialized.current) {
            initialized.current = true;
            wheelRef.current = degrees;
            setWheelHeading(degrees);
            return;
        }
        const from = wheelRef.current;
        const delta = normalizeHeading(degrees - from + 180) - 180;
        let frame;
        let start;
        const animate = time => {
            start ??= time;
            const progress = Math.min(1, (time - start) / 280);
            const eased = 1 - (1 - progress) ** 3;
            wheelRef.current = normalizeHeading(from + delta * eased);
            setWheelHeading(wheelRef.current);
            if (progress < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [degrees, valid]);
    const foreground = isNightMode ? '#c49797' : '#f3f6fa';
    const accent = isNightMode ? '#328b66' : '#45d39a';
    const rounded = Math.round(degrees) % 360;
    return (
        <View style={styles.container} accessible accessibilityLabel={valid ? t('headingDescription', { angle: rounded, cardinal: cardinalHeading(degrees).replace('W', t('west')) }) : t('headingNoData')}>
            <Svg width="100%" height="100%" viewBox="0 0 320 110">
                <Defs>
                    <LinearGradient id={shadeId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor="#000000" stopOpacity={0.85} />
                        <Stop offset="22%" stopColor="#000000" stopOpacity={0.2} />
                        <Stop offset="50%" stopColor={foreground} stopOpacity={0.07} />
                        <Stop offset="78%" stopColor="#000000" stopOpacity={0.2} />
                        <Stop offset="100%" stopColor="#000000" stopOpacity={0.85} />
                    </LinearGradient>
                    <ClipPath id={clipId}><Rect x={8} y={10} width={304} height={88} rx={8} /></ClipPath>
                    <LinearGradient id={frameId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={foreground} stopOpacity={0.55} />
                        <Stop offset="45%" stopColor={foreground} stopOpacity={0.1} />
                        <Stop offset="100%" stopColor={foreground} stopOpacity={0.35} />
                    </LinearGradient>
                    <LinearGradient id={glassId} x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={foreground} stopOpacity={0.22} />
                        <Stop offset="46%" stopColor={foreground} stopOpacity={0.06} />
                        <Stop offset="50%" stopColor={foreground} stopOpacity={0.01} />
                        <Stop offset="80%" stopColor="#000000" stopOpacity={0.12} />
                        <Stop offset="100%" stopColor={foreground} stopOpacity={0.12} />
                    </LinearGradient>
                </Defs>
                {/* Barra de cristal: fondo hundido, bisel y reflejo sobre la escala. */}
                <Rect x={5} y={10} width={310} height={92} rx={9} fill="#000000" fillOpacity={0.4} />
                <Rect x={5} y={8} width={310} height={92} rx={9} fill={isNightMode ? '#060f1c' : '#0a2038'} stroke={`url(#${frameId})`} strokeWidth={1.2} />
                {valid && <G clipPath={`url(#${clipId})`}>
                    {compassTicks(wheelHeading).map(tick => {
                        const major = tick.angle % 30 === 0;
                        return <G key={tick.angle} opacity={tick.opacity} transform={`translate(${tick.x}, 0) scale(${tick.scale}, 1) translate(${-tick.x}, 0)`}>
                            {major && <Text x={tick.x} y={32} textAnchor="middle" fill={accent} fontFamily="NauticalFont" fontSize={16}>{tick.angle}</Text>}
                            <Line x1={tick.x} y1={major ? 39 : 48} x2={tick.x} y2={65} stroke={foreground} strokeWidth={major ? 2 : 1.3} />
                            {tick.angle % 45 === 0 && <Text x={tick.x} y={82} textAnchor="middle" fill={foreground} fontFamily="NauticalFont" fontSize={14}>{cardinalHeading(tick.angle).replace('W', t('west'))}</Text>}
                        </G>;
                    })}
                </G>}
                <Rect x={6} y={9} width={308} height={90} rx={8} fill={`url(#${shadeId})`} />
                <Rect x={6} y={9} width={308} height={90} rx={8} fill={`url(#${glassId})`} />
                <Line x1={15} y1={11} x2={305} y2={11} stroke={foreground} strokeOpacity={0.32} strokeWidth={0.8} />
                <Line x1={15} y1={97} x2={305} y2={97} stroke={foreground} strokeOpacity={0.16} strokeWidth={0.8} />
                <Line x1={160} y1={13} x2={160} y2={95} stroke="#dc1212" strokeWidth={1.5} />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 4 } });
