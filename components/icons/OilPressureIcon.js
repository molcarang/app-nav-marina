import Svg, { Path } from 'react-native-svg';

export default function OilPressureIcon({ size = 46.8, color }) {
    return <Svg width={size} height={size} viewBox="0 0 408 264">
        <Path d="M94 96 47 79Q32 73 27 89l-5 16q-5 13 8 18l64 23"
            fill="none" stroke={color} strokeWidth={18} strokeLinejoin="round" strokeLinecap="round" />
        <Path d="M94 115h110l15 19 108-32-72 97H94Z"
            fill="none" stroke={color} strokeWidth={18} strokeLinejoin="round" />
        <Path d="m219 134 146-41 4 6M132 66h49M156 72v25"
            fill="none" stroke={color} strokeWidth={18} strokeLinejoin="round" strokeLinecap="round" />
        <Path d="M369 130c-3 0-3 9-6 17-4 11-9 19-9 26 0 19 30 19 30 0 0-7-5-15-9-26-3-8-3-17-6-17Z" fill={color} />
    </Svg>;
}
