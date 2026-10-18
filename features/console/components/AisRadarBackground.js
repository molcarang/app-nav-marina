import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Fragmento de radar decorativo: no representa contactos ni distancias reales. */
export default function AisRadarBackground() {
    const gradientId = `ais-background-${useId().replace(/:/g, '')}`;
    return <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFillObject}>
        <Svg width="100%" height="100%" viewBox="0 0 600 100" preserveAspectRatio="xMidYMid slice">
            <Defs>
                <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#102231" />
                    <Stop offset="55%" stopColor="#19364f" />
                    <Stop offset="100%" stopColor="#0c1d2b" />
                </LinearGradient>
            </Defs>
            <Rect width={600} height={100} fill={`url(#${gradientId})`} />
            <G fill="none" stroke="#7ca9c2" opacity={0.3}>
                {[65, 120, 175, 230, 285].map(radius =>
                    <Circle key={radius} cx={390} cy={155} r={radius} strokeWidth={1.2} />)}
                {[35, 75, 115, 155].map(angle => {
                    const radians = angle * Math.PI / 180;
                    return <Line key={angle} x1={390} y1={155}
                        x2={390 + 350 * Math.cos(radians)} y2={155 - 350 * Math.sin(radians)}
                        strokeWidth={0.8} strokeDasharray="5 7" />;
                })}
            </G>
            <Circle cx={390} cy={155} r={202} fill="none" stroke="#7ab7c7"
                strokeWidth={10} opacity={0.06} />
            <Rect width={600} height={100} fill="#071522" opacity={0.2} />
        </Svg>
    </View>;
}
