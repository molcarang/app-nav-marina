import { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { GAUGE_THEME } from '../../../styles/GaugeTheme';

/** Timón en grados: negativo a babor, positivo a estribor. */
export default function RudderIndicator({ angle, alertAngle = 35, width, isNightMode }) {
    const metalId = `rudder-metal-${useId().replace(/:/g, '')}`;
    const valid = Number.isFinite(angle);
    const limit = Number.isFinite(alertAngle) && alertAngle > 0 ? alertAngle : 35;
    const isAlert = valid && Math.abs(angle) >= limit;
    const portColor = isNightMode ? '#a83232' : GAUGE_THEME.colors.engine;
    const starboardColor = isNightMode ? '#287a38' : 'rgba(0, 255, 0, 0.5)';
    const neutralColor = isNightMode ? '#999' : '#ddd';
    const color = valid && angle !== 0 ? (angle < 0 ? portColor : starboardColor) : neutralColor;
    const value = valid ? `${angle > 0 ? '+' : ''}${Math.round(angle)}°` : '---';
    // La escala deja un pequeño margen más allá del límite de alerta.
    const scale = limit + 5;
    const ticks = [];
    for (let degrees = Math.ceil(-scale / 10) * 10; degrees <= scale; degrees += 10) {
        ticks.push(degrees);
    }
    const position = valid ? (Math.max(-scale, Math.min(scale, angle)) / scale + 1) * 50 : 50;

    return (
        <View
            style={[styles.container, { width }]}
            accessible
            accessibilityLabel={`Timón ${valid ? `${value}${isAlert ? ', alerta' : ''}` : 'sin datos'}`}
        >
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.text}>
                <Text style={{ color, textDecorationLine: isAlert ? 'underline' : 'none' }}>{valid && angle === 0 ? 'CENTERED' : value}</Text>
            </Text>
            {width >= 140 && (
                <View style={styles.scale}>
                    <View style={[styles.track, { left: 0, backgroundColor: portColor }]} />
                    <View style={[styles.track, { left: '50%', backgroundColor: starboardColor }]} />
                    {ticks.map(degrees => (
                        <View
                            key={degrees}
                            style={[styles.tick, {
                                left: `${(degrees / scale + 1) * 50}%`,
                                height: degrees === 0 ? 9 : 6,
                            }]}
                        />
                    ))}
                    <View style={[styles.tick, { left: 0 }]} />
                    <View style={[styles.tick, { right: 0 }]} />
                    <Text style={[styles.degreeLabel, { left: 0 }]}>{scale}°</Text>
                    <Text style={[styles.degreeLabel, styles.zeroLabel]}>0°</Text>
                    <Text style={[styles.degreeLabel, { right: 0 }]}>{scale}°</Text>
                    {valid && (
                        <View pointerEvents="none" style={[styles.marker, { left: `${position}%` }]}>
                            <Svg width={12} height={12} viewBox="0 0 12 12">
                                <Defs>
                                    <RadialGradient id={metalId} cx="32%" cy="25%" r="75%">
                                        <Stop offset="0" stopColor={isNightMode ? '#bbb' : '#fff'} />
                                        <Stop offset="0.3" stopColor={isNightMode ? '#777' : '#dce2e8'} />
                                        <Stop offset="0.65" stopColor="#717b86" />
                                        <Stop offset="1" stopColor="#252c34" />
                                    </RadialGradient>
                                </Defs>
                                <Circle cx={6} cy={6} r={5} fill={`url(#${metalId})`} stroke="#333b45" strokeWidth={0.75} />
                                <Circle cx={4.5} cy={3.5} r={1} fill="#fff" opacity={isNightMode ? 0.35 : 0.8} />
                            </Svg>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { height: 40, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
    text: { fontFamily: 'NauticalFont', fontSize: 13, lineHeight: 18, textAlign: 'center', width: '100%' },
    scale: { width: '100%', height: 20, marginTop: 1 },
    track: { position: 'absolute', width: '50%', top: 2, height: 4, borderRadius: 2 },
    tick: { position: 'absolute', top: 0, width: 1, height: 8, backgroundColor: '#fff' },
    degreeLabel: { position: 'absolute', top: 9, color: '#fff', fontSize: 9, lineHeight: 10 },
    zeroLabel: { left: '50%', width: 24, marginLeft: -12, textAlign: 'center' },
    marker: { position: 'absolute', top: -2, width: 12, height: 12, transform: [{ translateX: -6 }] },
});
