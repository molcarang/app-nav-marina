import { useTranslation } from '../../localization/LanguageProvider';
import { Circle, G, Line, Path, Polygon, Text } from 'react-native-svg';
import SteelBall from './SteelBall';
import { describeArc, polarToCartesian } from '../../utils/Utils';

/** Instrumento SVG para el espacio izquierdo del panel de escora. Recibe grados. */
export default function RudderNeedle({ angle, limit = 35, isNightMode = false }) {
    const { t } = useTranslation();
    const valid = Number.isFinite(angle);
    const alertLimit = Number.isFinite(limit) && limit > 0 ? limit : 35;
    const range = alertLimit + 5;
    const rotation = valid ? -Math.max(-1, Math.min(1, angle / range)) * 65 : 0;
    const foreground = isNightMode ? '#c49797' : '#f3f6fa';
    const port = isNightMode ? '#a83232' : '#dc1212';
    const starboard = isNightMode ? '#287a38' : 'rgba(0, 255, 0, 0.8)';
    const alert = valid && Math.abs(angle) >= alertLimit;
    const ticks = [-range, 0, range];
    for (let tick = 10; tick < range; tick += 10) ticks.push(-tick, tick);

    return (
        <G>
            <Text x={165} y={(35 - 20) / 1.3} textAnchor="middle" fontFamily="NauticalFont" fontSize={17} fill={foreground}>{t('rudderLabel')}</Text>
            {/* Escala plana y ligera, con bandas de color y marcas independientes. */}
            <Path d={describeArc(165, 100, 83, 115, 245)} stroke="#10212d" strokeWidth={8} fill="none" strokeLinecap="round" />
            <Path d={describeArc(165, 100, 83, 181, 245)} stroke={port} strokeWidth={4} fill="none" strokeLinecap="round" />
            <Path d={describeArc(165, 100, 83, 115, 179)} stroke={starboard} strokeWidth={4} fill="none" strokeLinecap="round" />
            {ticks.map(tick => {
                const degrees = 180 - tick / range * 65;
                const inner = polarToCartesian(165, 100, tick === 0 ? 69 : 73, degrees);
                const outer = polarToCartesian(165, 100, 79, degrees);
                const label = polarToCartesian(165, 100, tick === 0 ? 104 : 116, degrees);
                return (
                    <G key={tick}>
                        <Line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={foreground} strokeWidth={1.5} />
                        {(tick === 0 || Math.abs(tick) === range) && (
                            <Text x={label.x} y={label.y + 5} textAnchor="middle" fontFamily="NauticalFont" fontSize={13} fill={foreground}>
                                {tick}°
                            </Text>
                        )}
                    </G>
                );
            })}
            {valid && (
                <G rotation={rotation} origin="165, 100">
                    <Polygon points="165,179 162.5,103 165,95 167.5,103" fill={alert ? port : foreground} />
                </G>
            )}
            <Circle cx={165} cy={100} r={8} fill="#10212d" stroke={foreground} strokeOpacity={0.3} strokeWidth={1} />
            <SteelBall cx={165} cy={100} radius={5.5} isNightMode={isNightMode} />
            <Text x={165} y={68} textAnchor="middle" fontFamily="NauticalFont" fontSize={24} fill={alert ? port : foreground}>
                {valid ? `${angle > 0 ? '+' : ''}${Math.round(angle)}°` : '---'}
            </Text>
        </G>
    );
}
