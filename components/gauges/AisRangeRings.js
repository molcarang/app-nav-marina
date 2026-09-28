import { Circle, G, Line } from 'react-native-svg';

/** Tres anillos equidistantes: el exterior representa el alcance AIS seleccionado. */
export default function AisRangeRings({ center, radius, size }) {
    const color = '#73a9bb';
    return <G pointerEvents="none">
        <G stroke={color} strokeWidth={Math.max(0.8, size * 0.002)}
            strokeDasharray={`${size * 0.009} ${size * 0.008}`} opacity={0.5}>
            <Line x1={center - radius} y1={center} x2={center + radius} y2={center} />
            <Line x1={center} y1={center - radius} x2={center} y2={center + radius} />
        </G>
        {[1, 2, 3].map(ring => {
            const ringRadius = radius * ring / 3;
            return <G key={ring}>
                <Circle cx={center} cy={center} r={ringRadius} fill="none"
                    stroke={color} strokeWidth={Math.max(0.8, size * 0.002)}
                    strokeDasharray={`${size * 0.009} ${size * 0.008}`} opacity={0.5} />
            </G>;
        })}
    </G>;
}
