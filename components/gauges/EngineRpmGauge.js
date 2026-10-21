import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useTranslation } from '../../localization/LanguageProvider';
import { GAUGE_THEME } from '../../styles/GaugeTheme';
import { GaugeDefs } from './shared/GaugeDefs';
import { computeCommonDims, polarToCartesian } from './shared/gaugeUtils';
import EngineGaugeNeedle from './EngineGaugeNeedle';
import { describeArc } from '../../utils/Utils';
import { normalizeEngineRpmSettings } from '../../features/console/model/engineRpmSettings.js';

const DIAL_SIZE = 400;
const { CENTER, BEZEL_SIZE, RADIUS } = computeCommonDims(DIAL_SIZE);

export default function EngineRpmGauge({ size, rpm, sogKnots, connected, settings }) {
    const { t } = useTranslation();
    const prefix = `rpm-${useId().replace(/:/g, '')}-`;
    const paint = name => `url(#${prefix}${name})`;
    const value = connected && Number.isFinite(rpm) && rpm >= 0 ? rpm : null;
    const sogValue = connected && sogKnots != null && sogKnots !== ''
        && Number.isFinite(Number(sogKnots)) && Number(sogKnots) >= 0 ? Number(sogKnots) : null;
    const { tachometerMaxRpm: maxRpm, tachometerRedZoneRpm: redZoneRpm } = normalizeEngineRpmSettings(settings);
    const angle = 225 + Math.min(maxRpm, value ?? 0) / maxRpm * 270;
    const minorStep = maxRpm <= 10000 ? 100 : 500;
    const majorStep = maxRpm <= 5000 ? 1000 : maxRpm <= 10000 ? 2000 : 5000;
    const ticks = [...new Set([...Array.from({ length: Math.floor(maxRpm / minorStep) + 1 }, (_, index) => index * minorStep), maxRpm])];
    const redStartAngle = 225 + redZoneRpm / maxRpm * 270;
    // Short tangent gradients follow the dial from the red-zone start to maximum RPM.
    const redSegmentCount = Math.ceil((495 - redStartAngle) / 4);
    const redSegments = Array.from({ length: redSegmentCount }, (_, index) => {
        const startRatio = index / redSegmentCount;
        const endRatio = (index + 1) / redSegmentCount;
        const startAngle = redStartAngle + (495 - redStartAngle) * startRatio;
        const endAngle = redStartAngle + (495 - redStartAngle) * endRatio;
        return { id: `${prefix}red-zone-${index}`, startRatio, endRatio, startAngle, endAngle,
            start: polarToCartesian(CENTER, CENTER, 168, startAngle),
            end: polarToCartesian(CENTER, CENTER, 168, endAngle) };
    });
    const label = value === null ? t('engineRpmNoData') : t('engineRpmDescription', { value: Math.round(value) });
    const sogLabel = sogValue === null ? t('engineSogNoData') : t('engineSogDescription', { value: sogValue.toFixed(1) });
    return <View accessible accessibilityRole="image" accessibilityLabel={`${label}. ${sogLabel}`} style={{ width: size, height: size }}>
        <Svg accessible={false} aria-hidden width={size} height={size} viewBox="0 0 400 400">
            <Defs>
                <GaugeDefs idPrefix={prefix} />
                {redSegments.map(segment => <LinearGradient key={segment.id} id={segment.id} gradientUnits="userSpaceOnUse"
                    x1={segment.start.x} y1={segment.start.y} x2={segment.end.x} y2={segment.end.y}>
                    <Stop offset="0%" stopColor="#ff2020" stopOpacity={segment.startRatio} />
                    <Stop offset="100%" stopColor="#ff2020" stopOpacity={segment.endRatio} />
                </LinearGradient>)}
            </Defs>
            <Circle cx={CENTER} cy={CENTER} r={CENTER - BEZEL_SIZE / 4} fill="none" stroke={paint('bezelOuter')} strokeWidth={BEZEL_SIZE / 2} />
            <Circle cx={CENTER} cy={CENTER} r={RADIUS + BEZEL_SIZE / 4} fill="none" stroke={paint('bezelInner')} strokeWidth={BEZEL_SIZE / 2} />
            <Circle cx={CENTER} cy={CENTER} r={CENTER - BEZEL_SIZE / 2} fill="none" stroke={paint('bezelRidge')} strokeWidth={1.5} opacity={0.6} />
            <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill={GAUGE_THEME.colors.bg} />
            <G transform="translate(20 20) scale(0.9)">
                <Circle cx={CENTER} cy={CENTER} r={128} fill="none" stroke={paint('redMetalOuter')} strokeWidth={6} />
                <Circle cx={CENTER} cy={CENTER} r={122} fill="none" stroke={paint('redMetalInner')} strokeWidth={6} />
                <Circle cx={CENTER} cy={CENTER} r={125} fill="none" stroke={paint('redMetalRidge')} strokeWidth={1.5} opacity={0.8} />
            </G>
            {redSegments.map(segment => <Path key={segment.id}
                d={describeArc(CENTER, CENTER, 168, segment.startAngle, segment.endAngle)}
                fill="none" stroke={`url(#${segment.id})`} strokeWidth={16} strokeLinecap="butt" />)}
            {ticks.map(tickRpm => {
                const tickAngle = 225 + tickRpm / maxRpm * 270;
                const major = tickRpm % majorStep === 0 || tickRpm === maxRpm;
                const half = tickRpm % (majorStep / 2) === 0;
                const showLabel = major && (tickRpm === maxRpm || maxRpm - tickRpm >= majorStep * 0.3);
                const start = polarToCartesian(CENTER, CENTER, major ? 154 : half ? 160 : 165, tickAngle);
                const end = polarToCartesian(CENTER, CENTER, 172, tickAngle);
                const text = polarToCartesian(CENTER, CENTER, 140, tickAngle);
                return <G key={tickRpm}>
                    <Line x1={start.x} y1={start.y} x2={end.x} y2={end.y}
                        stroke={major ? '#ff9800' : '#fff'} strokeWidth={major ? 3 : 1} opacity={major ? 1 : 0.75} />
                    {showLabel && <SvgText x={text.x} y={text.y + 6} textAnchor="middle" fill="#fff" fontFamily="NauticalFont" fontSize={18}>
                        {tickRpm / 1000}
                    </SvgText>}
                </G>;
            })}
            <SvgText x={CENTER} y={119} textAnchor="middle" fill="#ff9800" fontFamily="NauticalFont" fontSize={16}>RPM</SvgText>
            <SvgText x={CENTER} y={139} textAnchor="middle" fill="#aaa" fontFamily="NauticalFont" fontSize={10}>× 1000</SvgText>
            <EngineGaugeNeedle center={CENTER} angle={angle} length={109.8} halfWidth={7.2}
                hubRadius={9.9} paint={paint} hasData={value !== null} />
            <Rect x={148} y={232} width={104} height={48} rx={9} fill="#101820" stroke={paint('redMetalOuter')} strokeWidth={1.5} />
            <SvgText x={CENTER} y={256} textAnchor="middle" fill="#fff" fontFamily="NauticalFont" fontSize={24}>
                {sogValue === null ? '—' : sogValue.toFixed(1)}
            </SvgText>
            <SvgText x={CENTER} y={271} textAnchor="middle" fill="#aaa" fontFamily="NauticalFont" fontSize={9}>SOG · KTS</SvgText>
            <Ellipse cx={151} cy={87} rx={68} ry={17} rotation={-32} origin="151,87" fill={paint('glassReflection')} opacity={0.5} />
        </Svg>
    </View>;
}
