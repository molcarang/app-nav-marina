import Svg, { Path, Rect } from 'react-native-svg';

export default function FuelLevelIcon({ size = 36, color }) {
    return <Svg width={size} height={size} viewBox="0 0 64 64">
        <Rect x={10} y={9} width={29} height={45} rx={3}
            fill="none" stroke={color} strokeWidth={3} />
        <Rect x={16} y={16} width={17} height={14} rx={1}
            fill="none" stroke={color} strokeWidth={3} />
        <Path d="M6 55h37M39 33h5v12a5 5 0 0 0 10 0V24L43 13M48 18v10h6"
            fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>;
}
