import { useId } from 'react';
import { Circle, Defs, G, RadialGradient, Stop } from 'react-native-svg';

/** Indicador de acero compartido por los instrumentos SVG. */
export default function SteelBall({ cx, cy, radius = 10, isNightMode = false }) {
    const gradientId = `steel-${useId().replace(/:/g, '')}`;

    return (
        <G>
            <Defs>
                <RadialGradient id={gradientId} cx="32%" cy="25%" r="75%">
                    <Stop offset="0%" stopColor={isNightMode ? '#b6a3a3' : '#ffffff'} />
                    <Stop offset="20%" stopColor={isNightMode ? '#877777' : '#e1e7ed'} />
                    <Stop offset="48%" stopColor={isNightMode ? '#514646' : '#929fae'} />
                    <Stop offset="78%" stopColor={isNightMode ? '#242020' : '#35414f'} />
                    <Stop offset="100%" stopColor={isNightMode ? '#655454' : '#b2bec9'} />
                </RadialGradient>
            </Defs>
            <Circle cx={cx + radius * 0.1} cy={cy + radius * 0.3} r={radius * 1.1} fill="#000" opacity={0.4} />
            <Circle cx={cx} cy={cy} r={radius} fill={`url(#${gradientId})`} stroke={isNightMode ? '#736060' : '#c5ced7'} strokeWidth={radius * 0.08} />
            <Circle cx={cx - radius * 0.3} cy={cy - radius * 0.4} r={radius * 0.2} fill={isNightMode ? '#d0baba' : '#fff'} opacity={0.65} />
        </G>
    );
}
