import React, { useMemo } from 'react';
import { G, Line, Path } from 'react-native-svg';

/** Angular fade behind the clockwise leading edge, confined to the AIS radius. */
export default function AisRadarSweep({ center, radius, size, phase, isNightMode }) {
    const sectors = useMemo(() => {
        const count = 90;
        const trailDegrees = 90;
        const point = degrees => {
            const radians = (degrees - 90) * Math.PI / 180;
            return `${center + radius * Math.cos(radians)} ${center + radius * Math.sin(radians)}`;
        };
        return Array.from({ length: count }, (_, index) => {
            const start = -trailDegrees + index * trailDegrees / count;
            const end = Math.min(0, start + trailDegrees / count + 0.08);
            return {
                d: `M ${center} ${center} L ${point(start)} A ${radius} ${radius} 0 0 1 ${point(end)} Z`,
                opacity: Math.pow((index + 1) / count, 1.8) * 0.28,
            };
        });
    }, [center, radius]);

    return <G pointerEvents="none" rotation={phase * 360} origin={`${center}, ${center}`}
        opacity={isNightMode ? 0.55 : 1}>
        {sectors.map((sector, index) => <Path key={index} d={sector.d}
            fill="#45d39a" opacity={sector.opacity} />)}
        <Line x1={center} y1={center} x2={center} y2={center - radius}
            stroke="#73efbb" strokeWidth={Math.max(0.8, size * 0.0025)} opacity={0.65} />
    </G>;
}
