import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Carta decorativa abstracta; no representa la posición recibida del GPS.
export default function GpsMapBackground({ isNightMode }) {
    const veilId = `map-veil-${useId().replace(/:/g, '')}`;
    const coast = 'M-10 4 L46 -8 69 8 64 19 89 24 97 36 83 45 92 56 75 66 67 83 35 98 -10 98 Z';
    const island = 'M219 16 Q233 8 241 19 L248 32 240 43 224 39 215 29 Z';
    return <View pointerEvents="none" accessible={false} style={[StyleSheet.absoluteFillObject, { opacity: isNightMode ? 0.28 : 0.85 }]}>
        <Svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="xMidYMid slice">
            <Defs>
                <LinearGradient id={veilId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#101d28" stopOpacity={0.12} />
                    <Stop offset="50%" stopColor="#101d28" stopOpacity={0.28} />
                    <Stop offset="100%" stopColor="#101d28" stopOpacity={0.35} />
                </LinearGradient>
            </Defs>
            <Rect width={300} height={100} fill="#142b3b" />
            <G stroke="#7493a8" strokeWidth={0.6} opacity={0.23}>
                {[30, 90, 150, 210, 270].map(x => <Line key={x} x1={x} y1={0} x2={x} y2={100} />)}
                {[20, 50, 80].map(y => <Line key={y} x1={0} y1={y} x2={300} y2={y} />)}
            </G>
            {/* Trazos superpuestos de bajo contraste para suavizar los contornos. */}
            <G fill="none" stroke="#507b95" strokeLinejoin="round">
                {[6, 3, 1.2].map(strokeWidth => <G key={strokeWidth} strokeWidth={strokeWidth} opacity={strokeWidth === 1.2 ? 0.65 : 0.09}>
                    <Path d={coast} /><Path d={island} />
                </G>)}
            </G>
            <G fill="#45677e" opacity={0.65}><Path d={coast} /><Path d={island} /></G>
            <G fill="none" stroke="#648fa9" strokeWidth={1} opacity={0.38}>
                <Path d="M95 -10 C78 14 122 22 116 43 S99 73 90 108" />
                <Path d="M113 -10 C95 14 143 23 135 48 S123 82 112 108" />
                <Path d="M204 4 C229 -14 271 7 270 34 S246 68 215 53 187 24 204 4 Z" />
                <Path d="M153 107 C160 83 190 74 219 80 S272 96 312 67" />
            </G>
            <Rect width={300} height={100} fill={`url(#${veilId})`} />
        </Svg>
    </View>;
}
