import { StyleSheet, View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';

/** Relieve submarino decorativo; no representa una carta ni una ruta real. */
export default function WaypointMapBackground() {
    return (
        <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFillObject}>
            <Svg width="100%" height="100%" viewBox="0 0 600 140" preserveAspectRatio="xMidYMid slice">
                <Rect width={600} height={140} fill="#102732" />
                <Path d="M-20 140 V84 C64 52 102 131 194 112 S294 42 358 68 438 152 620 96 V140Z"
                    fill="#234852" opacity={0.32} />
                <G fill="none" stroke="#668f94" strokeWidth={0.8} opacity={0.24}>
                    {[0, 12, 24, 36, 48].map(offset => (
                        <Path key={offset} transform={`translate(0, ${offset})`}
                            d="M-30 58 C38 8 94 103 170 78 S270 0 343 31 431 115 502 73 572 37 630 56" />
                    ))}
                </G>
                <G fill="none" stroke="#729fa8" strokeWidth={0.8} opacity={0.2}>
                    {[0, 1, 2, 3].map(index => (
                        <Path key={index} transform={`translate(${index * 18}, ${index * -5})`}
                            d="M430 145 C385 106 399 63 444 55 S518 77 524 114 561 147 595 135" />
                    ))}
                </G>
                <G fill="none" stroke="#8bb0b9" strokeWidth={1} opacity={0.18}>
                    <Path d="M27 28 Q37 20 47 28 T67 28 M34 35 Q44 27 54 35 T74 35" />
                    <Path d="M276 117 Q289 107 302 117 T328 117 M285 126 Q298 116 311 126 T337 126" />
                </G>
                <Rect width={600} height={140} fill="#07121c" opacity={0.28} />
            </Svg>
        </View>
    );
}
