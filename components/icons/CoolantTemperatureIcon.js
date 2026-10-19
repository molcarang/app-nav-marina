import Svg, { Circle, Path } from 'react-native-svg';

export default function CoolantTemperatureIcon({ size = 46.8, color }) {
    return <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path d="M22 37V12a6 6 0 0 1 12 0v25a11 11 0 1 1-12 0Z"
            fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />
        <Path d="M28 19v25M38 16h7M38 24h5M38 32h7"
            fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
        <Circle cx={28} cy={46} r={5} fill={color} />
        <Path d="M43 43q4-4 8 0t8 0M42 52q4-4 8 0t8 0"
            fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </Svg>;
}
