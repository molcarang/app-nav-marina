import Svg, { Path, Rect } from 'react-native-svg';

export default function LowBatteryIcon({ size = 46.8, color }) {
    return <Svg width={size} height={size} viewBox="0 0 300 200">
        <Path d="M64 17V3h33v14M194 17V3h33v14" fill={color} />
        <Rect x={23} y={21} width={245} height={158} rx={2}
            fill="none" stroke={color} strokeWidth={11} />
        <Path d="M66 71h29M211 57v28M197 71h28"
            fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" />
    </Svg>;
}
