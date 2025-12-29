import { StyleSheet, Text, View } from 'react-native';
import { G, Line, Path } from 'react-native-svg';
import VesselGaugeFrame from './VesselGaugeFrame';

const RudderGauge = ({ angle = 0, size = 180, alertAngle = 30 }) => {
    const CENTER = size / 2;
    const RADIUS = CENTER - (size * 0.12);
    const rudderRadius = RADIUS - 15;
    const isAlertActive = Math.abs(angle) >= alertAngle;

    const EXPANSION_FACTOR = 1.6;
    const mapVisualAngle = (realAngle) => realAngle * EXPANSION_FACTOR;

    const COLOR_PORT = "#FF3B30";
    const COLOR_STBD = "#4CD964";
    const COLOR_CENTER = "#ffffff";

    const limit = (alertAngle + 5) * EXPANSION_FACTOR;
    const startRad = (-limit - 90) * (Math.PI / 180);
    const endRad = (limit - 90) * (Math.PI / 180);
    const xStart = CENTER + (rudderRadius + 5) * Math.cos(startRad);
    const yStart = CENTER + (rudderRadius + 5) * Math.sin(startRad);
    const xEnd = CENTER + (rudderRadius + 5) * Math.cos(endRad);
    const yEnd = CENTER + (rudderRadius + 5) * Math.sin(endRad);
    const arcPath = `M ${xStart} ${yStart} A ${rudderRadius + 5} ${rudderRadius + 5} 0 0 1 ${xEnd} ${yEnd}`;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <VesselGaugeFrame size={size}>
                {/* 1. ARCO DE FONDO */}
                <Path d={arcPath} fill="none" stroke="url(#bezelInner)" strokeWidth="20" strokeLinecap="round" opacity={0.2} />

                {/* 2. ESCALA EXPANDIDA */}
                {[-40, -30, -20, -10, 0, 10, 20, 30, 40].map((tick) => {
                    const visualAngle = mapVisualAngle(tick);
                    const tickRad = (visualAngle - 90) * (Math.PI / 180);
                    const tx1 = CENTER + (rudderRadius - 2) * Math.cos(tickRad);
                    const ty1 = CENTER + (rudderRadius - 2) * Math.sin(tickRad);
                    const tx2 = CENTER + (rudderRadius + 12) * Math.cos(tickRad);
                    const ty2 = CENTER + (rudderRadius + 12) * Math.sin(tickRad);
                    let tickColor = tick === 0 ? COLOR_CENTER : (tick < 0 ? COLOR_PORT : COLOR_STBD);

                    return <Line key={tick} x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={tickColor} strokeWidth={tick === 0 ? 3 : 2} opacity={0.8} />;
                })}

                {/* 3. AGUJA (Capa media) */}
                <G transform={`translate(${CENTER}, ${CENTER}) rotate(${angle * EXPANSION_FACTOR})`}>
                    <Path d={`M -7 0 L 0 ${-rudderRadius} L 0 0 Z`} fill="url(#needleSideA)" />
                    <Path d={`M 7 0 L 0 ${-rudderRadius} L 0 0 Z`} fill="url(#needleSideB)" />
                    <Line x1="0" y1="0" x2="0" y2={-rudderRadius} stroke="url(#bezelRidge)" strokeWidth="1.2" />
                </G>
            </VesselGaugeFrame>

            {/* 4. LECTURA DIGITAL (POR ENCIMA DEL FRAME) */}
            <View style={[styles.labelContainer, { top: CENTER + (RADIUS * 0.05) }]}>
                <Text style={[styles.angleText, isAlertActive && { color: '#FF4444' }]}>
                    {Math.abs(Math.round(angle))}°
                </Text>
                <Text style={styles.sideText}>
                    {angle < -1 ? 'PORT' : angle > 1 ? 'STBD' : 'CENTER'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    labelContainer: { position: 'absolute', alignItems: 'center', width: '100%', zIndex: 50 },
    angleText: { fontSize: 30, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'NauticalFont', textShadowColor: 'black', textShadowRadius: 6 },
    sideText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', letterSpacing: 2, marginTop: -4, fontWeight: 'bold' }
});

export default RudderGauge;