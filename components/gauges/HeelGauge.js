import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { G, Line, Path } from 'react-native-svg';
import VesselGaugeFrame from './VesselGaugeFrame';

const HeelGauge = ({ heel = 0, size = 180, limit = 25 }) => {
    const CENTER = size / 2;
    const RADIUS = CENTER - (size * 0.12);
    const scaleRadius = RADIUS - 5;
    
    const COLOR_PORT = "#FF3B30"; // Rojo
    const COLOR_STBD = "#4CD964"; // Verde
    const COLOR_CENTER = "#ffffff";
    const isAlertActive = Math.abs(heel) >= limit;

    const needleHalfLength = scaleRadius;
    const needleWidth = 7;



    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <VesselGaugeFrame size={size} >
                
                {/* GUÍA DE HORIZONTE FIJO */}
                <Line 
                    x1={CENTER - scaleRadius} 
                    y1={CENTER} 
                    x2={CENTER + scaleRadius} 
                    y2={CENTER} 
                    stroke="#ffffffff" 
                    strokeWidth="1" 
                />

                {/* ESCALA LATERAL SIMÉTRICA */}
                {[-45, -30, -15, 0, 15, 30, 45].map((tick) => {
                    const radRight = (tick) * (Math.PI / 180);
                    const radLeft = (180 - tick) * (Math.PI / 180);

                    return [
                        { rad: radRight, side: 'right' },
                        { rad: radLeft, side: 'left' }
                    ].map((item, idx) => {
                        const tx1 = CENTER + (scaleRadius - 5) * Math.cos(item.rad);
                        const ty1 = CENTER + (scaleRadius - 5) * Math.sin(item.rad);
                        const tx2 = CENTER + (scaleRadius + 10) * Math.cos(item.rad);
                        const ty2 = CENTER + (scaleRadius + 10) * Math.sin(item.rad);
                        
                        let tickColor = COLOR_CENTER;
                        if (tick > 0) {
                            tickColor = item.side === 'right' ? COLOR_STBD : COLOR_PORT;
                        } else if (tick < 0) {
                            tickColor = item.side === 'right' ? COLOR_PORT : COLOR_STBD;
                        }

                        return (
                            <Line 
                                key={`tick-${tick}-${item.side}`} 
                                x1={tx1} y1={ty1} x2={tx2} y2={ty2} 
                                stroke={tickColor} 
                                strokeWidth={tick === 0 ? 3 : 2} 
                                opacity={0.6} 
                            />
                        );
                    });
                })}

                {/* GRUPO MÓVIL (BARCO + AGUJA) - Rotación corregida */}
                <G transform={`translate(${CENTER}, ${CENTER}) rotate(${heel})`}>

                    {/* AGUJA DOBLE 3D (Se dibuja a 90° respecto al eje del barco para apuntar a los lados) */}
                    <G transform="rotate(90)">
                        <Path d={`M -${needleWidth} 0 L 0 ${-needleHalfLength} L 0 0 Z`} fill="url(#needleSideA)" />
                        <Path d={`M ${needleWidth} 0 L 0 ${-needleHalfLength} L 0 0 Z`} fill="url(#needleSideB)" />
                        
                        <Path d={`M -${needleWidth} 0 L 0 ${needleHalfLength} L 0 0 Z`} fill="url(#needleSideA)" />
                        <Path d={`M ${needleWidth} 0 L 0 ${needleHalfLength} L 0 0 Z`} fill="url(#needleSideB)" />
                        
                        <Line x1="0" y1={-needleHalfLength} x2="0" y2={needleHalfLength} stroke="url(#bezelRidge)" strokeWidth="1.2" />
                    </G>
                </G>
            </VesselGaugeFrame>

            {/* LECTURA DIGITAL SUPERIOR */}
            <View style={[styles.labelContainer, { top: CENTER - (RADIUS * 0.8) }]}>
                <Text style={[styles.angleText, isAlertActive && { color: '#FF4444' }]}>
                    {Math.abs(Math.round(heel))}°
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    labelContainer: { position: 'absolute', alignItems: 'center', width: '100%', zIndex: 50 },
    angleText: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        fontFamily: 'NauticalFont',
        color: '#FFFFFF', 
        textShadowColor: 'rgba(0,0,0,0.9)', 
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4 
    }
});

export default HeelGauge;