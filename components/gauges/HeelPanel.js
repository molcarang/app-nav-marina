import { View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text } from 'react-native-svg';
import RudderNeedle from './RudderNeedle';
import SteelBall from './SteelBall';
import SternSailboat from './SternSailboat';
import { describeArc, polarToCartesian } from '../../utils/Utils';

/** Escora en grados. La escala se limita a ±30°, la cifra conserva el valor real. */
export default function HeelPanel({ heel, width, isNightMode = false, rudderAngle, rudderLimit, backgroundColor }) {
    const valid = Number.isFinite(heel);
    const angle = valid ? heel : 0;
    const displayedAngle = Math.round(Math.abs(angle));
    const centered = valid && displayedAngle === 0;
    const side = !valid ? 'NO DATA' : centered ? 'CENTERED' : angle < 0 ? 'PORT' : 'STBD';
    const foreground = isNightMode ? '#c49797' : '#f3f6fa';
    const muted = isNightMode ? '#795353' : '#777777';
    const portColor = isNightMode ? '#a83232' : '#dc1212';
    const starboardColor = isNightMode ? '#287a38' : '#45d39a';
    const accent = !valid || centered ? foreground : angle < 0 ? portColor : starboardColor;
    const limitedAngle = Math.max(-30, Math.min(30, angle));
    // Arco inferior: los ángulos positivos avanzan hacia estribor (derecha).
    const scaleAngle = degrees => 180 - degrees * 4 / 3;
    const markerAngle = scaleAngle(limitedAngle);
    const channelRadius = 208;
    const channelArc = describeArc(600, 40, channelRadius, 137, 223);
    const ball = polarToCartesian(600, 40, channelRadius, markerAngle);
    const glassColor = isNightMode ? '#b58a8a' : '#c6edff';
    const glassHighlight = isNightMode ? '#d3a6a6' : '#f4fcff';

    return (
        <View
            style={{ width, marginTop: 8, marginBottom: 8 }}
            accessible
            accessibilityLabel={`${valid ? `Escora ${displayedAngle} grados, ${centered ? 'centrado' : angle < 0 ? 'babor' : 'estribor'}` : 'Escora sin datos'}. Timón ${Number.isFinite(rudderAngle) ? `${Math.round(rudderAngle)} grados` : 'sin datos'}`}
        >
            <Svg width={width} height={width * 0.425} viewBox="0 0 800 340">
                <Rect x={2} y={2} width={796} height={336} rx={18} fill={backgroundColor ?? (isNightMode ? 'rgba(30, 0, 0, 0.8)' : 'rgba(45, 45, 45, 0.75)')} stroke={muted} strokeWidth={2} />
                <G transform="translate(-14, 20) scale(1.3)">
                    <RudderNeedle angle={rudderAngle} limit={rudderLimit} isNightMode={isNightMode} />
                </G>
                <Line x1={400} y1={20} x2={400} y2={320} stroke={muted} strokeWidth={1} opacity={0.4} />

                {/* La línea de agua permanece horizontal; solo gira el barco. */}
                <G transform="translate(200, 0)">
                <Line x1={325} y1={195} x2={475} y2={195} stroke={muted} strokeWidth={1} />
                <G rotation={limitedAngle} origin="400, 180" opacity={valid ? 1 : 0.35}>
                    <G transform="translate(400, 180) scale(0.32) translate(-320, -466)">
                        <SternSailboat isNightMode={isNightMode} />
                    </G>
                </G>
                </G>
                <Text x={720} y={128} textAnchor="middle" fill={foreground} fontSize={44} fontFamily="NauticalFont">
                    {valid ? `${displayedAngle}°` : '---'}
                </Text>
                <Text x={720} y={159} textAnchor="middle" fill={accent} fontSize={12} fontFamily="NauticalFont" letterSpacing={1}>{side}</Text>

                {/* Pared posterior del tubo: capas transparentes sugieren el grosor del cristal. */}
                <G fill="none" strokeLinecap="round">
                    <Path d={channelArc} stroke="#000" strokeWidth={34} opacity={0.3} transform="translate(0, 3)" />
                    <Path d={channelArc} stroke={glassColor} strokeWidth={32} opacity={isNightMode ? 0.12 : 0.28} />
                    <Path d={channelArc} stroke={isNightMode ? '#100909' : '#071822'} strokeWidth={28} opacity={0.65} />
                    <Path d={channelArc} stroke={glassColor} strokeWidth={23} opacity={0.06} />
                    <Path d={describeArc(600, 40, channelRadius - 14, 137, 223)} stroke={glassHighlight} strokeWidth={1.2} opacity={isNightMode ? 0.2 : 0.5} />
                    <Path d={describeArc(600, 40, channelRadius + 14, 137, 223)} stroke={glassColor} strokeWidth={1.5} opacity={isNightMode ? 0.18 : 0.45} />
                </G>

                {/* Marcas cada 2° y valores numéricos cada 10°. */}
                <Path d={describeArc(600, 40, channelRadius + 11, 180, 220)} fill="none" stroke={portColor} strokeWidth={2} />
                <Path d={describeArc(600, 40, channelRadius + 11, 140, 180)} fill="none" stroke={starboardColor} strokeWidth={2} />
                {Array.from({ length: 31 }, (_, index) => index * 2 - 30).map(degrees => {
                    const major = degrees % 10 === 0;
                    const scaleColor = degrees === 0 ? foreground : degrees < 0 ? portColor : starboardColor;
                    const start = polarToCartesian(600, 40, channelRadius + (degrees === 0 ? -11 : major ? -6 : 3), scaleAngle(degrees));
                    const end = polarToCartesian(600, 40, channelRadius + 11, scaleAngle(degrees));
                    const label = polarToCartesian(600, 40, 251, scaleAngle(degrees));
                    return (
                        <G key={degrees}>
                            <Line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={scaleColor} strokeWidth={major ? 2 : 1} />
                            {major && <Text x={label.x} y={label.y + 5} textAnchor="middle" fill={scaleColor} fontSize={14} fontFamily="NauticalFont">{degrees > 0 ? `+${degrees}` : degrees}</Text>}
                        </G>
                    );
                })}
                {valid && (
                    <SteelBall cx={ball.x} cy={ball.y} isNightMode={isNightMode} />
                )}
                {/* Reflejos sobre la bola para situarla visualmente dentro del tubo. */}
                <G fill="none" strokeLinecap="round" stroke={glassHighlight} opacity={isNightMode ? 0.4 : 1}>
                    <Path d={channelArc} strokeWidth={26} opacity={0.035} />
                    <Path d={describeArc(600, 40, channelRadius - 7, 140, 220)} strokeWidth={3.5} opacity={0.18} />
                    <Path d={describeArc(600, 40, channelRadius - 8, 143, 217)} strokeWidth={1} opacity={0.55} />
                    <Path d={describeArc(600, 40, channelRadius + 10, 146, 174)} strokeWidth={1.5} opacity={0.3} />
                    <Path d={describeArc(600, 40, channelRadius + 10, 193, 214)} strokeWidth={1.5} opacity={0.2} />
                </G>
                <Text x={428} y={316} fill={portColor} fontSize={16} fontFamily="NauticalFont" letterSpacing={2}>PORT</Text>
                <Text x={772} y={316} textAnchor="end" fill={starboardColor} fontSize={16} fontFamily="NauticalFont" letterSpacing={2}>STBD</Text>
            </Svg>
        </View>
    );
}
