import Svg, { G, Path } from 'react-native-svg';
import EngineIcon from './EngineIcon';

/** Existing engine outline with the signal arcs from the status reference. */
export default function EngineRunningIcon({ size = 28, color }) {
    return <Svg width={size} height={size} viewBox="0 0 64 64">
        <G fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round">
            <Path d="M20 9 Q32 -1 44 9" />
            <Path d="M24 14 Q32 7 40 14" />
            <Path d="M28 19 Q32 15 36 19" />
        </G>
        <G transform="translate(4 16)"><EngineIcon size={56} color={color} /></G>
    </Svg>;
}
