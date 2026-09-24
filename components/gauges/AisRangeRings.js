import { Circle, G, Line } from 'react-native-svg';

/** Referencias de distancia para AIS; el radio exterior representa 6 millas náuticas. */
export default function AisRangeRings({ center, radius, size }) {
    const color = '#73a9bb';
    return <G pointerEvents="none">
        <G stroke={color} strokeWidth={Math.max(0.8, size * 0.002)}
            strokeDasharray={`${size * 0.009} ${size * 0.008}`} opacity={0.5}>
            <Line x1={center - radius} y1={center} x2={center + radius} y2={center} />
            <Line x1={center} y1={center - radius} x2={center} y2={center + radius} />
        </G>
        {[2, 4, 6].map(miles => {
            const ringRadius = radius * miles / 6;
            return <G key={miles}>
                <Circle cx={center} cy={center} r={ringRadius} fill="none"
                    stroke={color} strokeWidth={Math.max(0.8, size * 0.002)}
                    strokeDasharray={`${size * 0.009} ${size * 0.008}`} opacity={0.5} />
            </G>;
        })}
    </G>;
}
