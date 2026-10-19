import { G, Polygon } from 'react-native-svg';
import SteelBall from './SteelBall';

/** The central tachometer's two red facets and steel pivot, shared by all engine dials. */
export default function EngineGaugeNeedle({ center, angle, length, halfWidth, hubRadius, paint, hasData }) {
    const tip = center - length;
    const base = center + length * 5 / 122;
    const tail = center + length * 30 / 122;
    return <>
        <G rotation={angle} origin={`${center}, ${center}`}>
            <Polygon points={`${center},${tip} ${center - halfWidth},${base} ${center},${tail}`}
                fill={hasData ? paint('needleSideA') : '#87939b'} />
            <Polygon points={`${center},${tip} ${center + halfWidth},${base} ${center},${tail}`}
                fill={hasData ? paint('needleSideB') : '#52616b'} />
        </G>
        <SteelBall cx={center} cy={center} radius={hubRadius} />
    </>;
}
