import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { GAUGE_THEME } from '../../styles/GaugeTheme';
import { GaugeDefs } from './shared/GaugeDefs';
import { computeCommonDims, polarToCartesian } from './shared/gaugeUtils';
import EngineGaugeNeedle from './EngineGaugeNeedle';
import { describeArc } from '../../utils/Utils';

const BASE_DIMS = computeCommonDims(240);
const { CENTER } = BASE_DIMS;

export default function EngineInstrumentGauge({ size, bezelWidth, value, maximum, tickStep, majorStep, label, unit, description, icon: Icon, lowWarningThreshold }) {
    const prefix = `engine-instrument-${useId().replace(/:/g, '')}-`;
    const paint = name => `url(#${prefix}${name})`;
    const angle = 288 + Math.max(0, Math.min(maximum, value ?? 0)) / maximum * 144;
    const BEZEL_SIZE = bezelWidth == null ? BASE_DIMS.BEZEL_SIZE : bezelWidth * 240 / size;
    const RADIUS = CENTER - BEZEL_SIZE;
    const faceScale = RADIUS / BASE_DIMS.RADIUS;
    const faceOffset = CENTER * (1 - faceScale);
    const warningSweep = Number.isFinite(lowWarningThreshold)
        ? Math.max(0, Math.min(maximum, lowWarningThreshold)) / maximum * 144 : 0;
    const segmentCount = Math.ceil(warningSweep / 4);
    const warningSegments = Array.from({ length: segmentCount }, (_, index) => {
        const startRatio = index / segmentCount;
        const endRatio = (index + 1) / segmentCount;
        const startAngle = 288 + warningSweep * startRatio;
        const endAngle = 288 + warningSweep * endRatio;
        return { id: `${prefix}low-warning-${index}`, startRatio, endRatio, startAngle, endAngle,
            start: polarToCartesian(CENTER, CENTER, 100, startAngle),
            end: polarToCartesian(CENTER, CENTER, 100, endAngle) };
    });
    return <View accessible accessibilityRole="image" accessibilityLabel={description} style={{ width: size, height: size }}>
        <Svg accessible={false} aria-hidden width={size} height={size} viewBox="0 0 240 240">
            <Defs>
                <GaugeDefs idPrefix={prefix} />
                {warningSegments.map(segment => <LinearGradient key={segment.id} id={segment.id} gradientUnits="userSpaceOnUse"
                    x1={segment.start.x} y1={segment.start.y} x2={segment.end.x} y2={segment.end.y}>
                    <Stop offset="0%" stopColor="#ff2020" stopOpacity={1 - segment.startRatio} />
                    <Stop offset="100%" stopColor="#ff2020" stopOpacity={1 - segment.endRatio} />
                </LinearGradient>)}
            </Defs>
            <Circle cx={CENTER} cy={CENTER} r={CENTER - BEZEL_SIZE / 4} fill="none" stroke={paint('bezelOuter')} strokeWidth={BEZEL_SIZE / 2} />
            <Circle cx={CENTER} cy={CENTER} r={RADIUS + BEZEL_SIZE / 4} fill="none" stroke={paint('bezelInner')} strokeWidth={BEZEL_SIZE / 2} />
            <Circle cx={CENTER} cy={CENTER} r={CENTER - BEZEL_SIZE / 2} fill="none" stroke={paint('bezelRidge')} strokeWidth={BEZEL_SIZE / 16} opacity={0.6} />
            <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill={GAUGE_THEME.colors.bg} />
            <G transform={`translate(${faceOffset} ${faceOffset}) scale(${faceScale})`}>
            <G transform="translate(12 12) scale(0.9)">
                <Circle cx={CENTER} cy={CENTER} r={69} fill="none" stroke={paint('redMetalOuter')} strokeWidth={3.6} />
                <Circle cx={CENTER} cy={CENTER} r={65.4} fill="none" stroke={paint('redMetalInner')} strokeWidth={3.6} />
                <Circle cx={CENTER} cy={CENTER} r={67.2} fill="none" stroke={paint('redMetalRidge')} strokeWidth={1} opacity={0.8} />
            </G>
            {warningSegments.map(segment => <Path key={segment.id}
                d={describeArc(CENTER, CENTER, 100, segment.startAngle, segment.endAngle)}
                fill="none" stroke={`url(#${segment.id})`} strokeWidth={10} strokeLinecap="butt" />)}
            {Array.from({ length: Math.round(maximum / tickStep) + 1 }, (_, index) => {
                const tickValue = index * tickStep;
                const tickAngle = 288 + tickValue / maximum * 144;
                const major = tickValue % majorStep === 0;
                const start = polarToCartesian(CENTER, CENTER, major ? 91 : 98, tickAngle);
                const end = polarToCartesian(CENTER, CENTER, 104, tickAngle);
                const text = polarToCartesian(CENTER, CENTER, 80, tickAngle);
                return <G key={index}>
                    <Line x1={start.x} y1={start.y} x2={end.x} y2={end.y}
                        stroke={major ? '#ff9800' : '#fff'} strokeWidth={major ? 2 : 1} opacity={major ? 1 : 0.7} />
                    {major && <SvgText x={text.x} y={text.y + 4} textAnchor="middle" fill="#fff" fontFamily="NauticalFont" fontSize={11}>
                        {tickValue}
                    </SvgText>}
                </G>;
            })}
            <SvgText x={CENTER} y={88} textAnchor="middle" fill="#ff9800" fontFamily="NauticalFont" fontSize={12}>{label}</SvgText>
            <SvgText x={CENTER} y={102} textAnchor="middle" fill="#aaa" fontFamily="NauticalFont" fontSize={10}>{unit}</SvgText>
            {Icon && <G transform={`translate(${CENTER - 18} 186)`}>
                <Icon size={36} color="#ffffff" />
            </G>}
            <EngineGaugeNeedle center={CENTER} angle={angle} length={63}
                halfWidth={5} hubRadius={6}
                paint={paint} hasData />
            <Ellipse cx={90} cy={52} rx={41} ry={10} rotation={-32} origin="90,52" fill={paint('glassReflection')} opacity={0.5} />
            </G>
        </Svg>
    </View>;
}
