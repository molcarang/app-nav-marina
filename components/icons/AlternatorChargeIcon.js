import Svg, { Path, Rect } from 'react-native-svg';

export default function AlternatorChargeIcon({ size = 46.8, color }) {
    return <Svg width={size} height={size} viewBox="20 30 300 210">
        <Rect x={46} y={44} width={166} height={130} rx={18}
            fill="none" stroke={color} strokeWidth={8} />
        <Path d="M46 73h-7a7 7 0 0 0-7 7v58a7 7 0 0 0 7 7h7M212 73h14a9 9 0 0 1 9 9v54a9 9 0 0 1-9 9h-14M235 99h29v20h-29M278 99h29v20h-29M264 65h14v87h-14Z"
            fill="none" stroke={color} strokeWidth={8} strokeLinejoin="round" />
        <Path d="M72 61v96M187 61v96M92 65h74M92 87h74M92 109h74M92 131h74M92 153h74M82 174v24h14v-24M162 174v24h14v-24M62 222v-9a15 15 0 0 1 15-15h105a15 15 0 0 1 15 15v9Z"
            fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>;
}
