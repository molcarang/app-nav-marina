import { useId } from 'react';
import Svg, { ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Escala XTE de ±0,1 NM con el acabado del compás horizontal. */
export default function CrossTrackRibbon({ offset, height = 45 }) {
    const clipId = `xte-${useId().replace(/:/g, '')}`;
    const glassId = `${clipId}-glass`;
    const frameId = `${clipId}-frame`;
    const shadeId = `${clipId}-shade`;
    const foreground = '#f3f6fa';
    const isNightMode = false; // La intensidad nocturna se aplica al conjunto de la pantalla.
    const valid = Number.isFinite(offset);
    const markerX = valid ? 160 + Math.max(-1, Math.min(1, offset / 0.1)) * 135 : 160;
    const color = offset < 0 ? '#dc1212' : '#45d39a';
    return (
        <Svg width="100%" height={height} viewBox="0 0 320 110" preserveAspectRatio="none">
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
                <Rect x={5} y={10} width={310} height={92} rx={9} fill="#000000" fillOpacity={0.4} />
                <Rect x={5} y={8} width={310} height={92} rx={9} fill={isNightMode ? '#060f1c' : '#0a2038'} stroke={`url(#${frameId})`} strokeWidth={1.2} />
                <G clipPath={`url(#${clipId})`} opacity={valid ? 1 : 0.3}>
                    {Array.from({ length: 19 }, (_, i) => {
                        const x = 25 + i * 15;
                        const major = i % 3 === 0;
                        return <Line key={i} x1={x} x2={x} y1={major ? 30 : 43} y2={80}
                            stroke={foreground} strokeWidth={major ? 2 : 1.3} />;
                    })}
                </G>
                <Rect x={6} y={9} width={308} height={90} rx={8} fill={`url(#${shadeId})`} />
                <Rect x={6} y={9} width={308} height={90} rx={8} fill={`url(#${glassId})`} />
                <Line x1={15} y1={11} x2={305} y2={11} stroke={foreground} strokeOpacity={0.32} strokeWidth={0.8} />
                <Line x1={15} y1={97} x2={305} y2={97} stroke={foreground} strokeOpacity={0.16} strokeWidth={0.8} />
                <Line x1={160} y1={13} x2={160} y2={95} stroke="#dc1212" strokeWidth={1.5} />
                {valid && <Path d={`M${markerX} 27 L${markerX + 8} 81 L${markerX} 68 L${markerX - 8} 81 Z`}
                    fill={color} stroke={foreground} strokeWidth={0.8} />}
        </Svg>
    );
}
