import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { GaugeDefs }  from './shared/GaugeDefs';
import { GAUGE_THEME } from '../../styles/GaugeTheme';

const VesselGaugeFrame = ({ size, children, showHub = true }) => {
    const CENTER = size / 2;
    const BEZEL_SIZE = size * 0.12;
    const RADIUS = CENTER - BEZEL_SIZE;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Defs>
                    <GaugeDefs />
                    <LinearGradient id="vesselGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor="white" stopOpacity="0.15" />
                        <Stop offset="50%" stopColor="white" stopOpacity="0" />
                    </LinearGradient>
                    <RadialGradient id="vesselFlare" cx="30%" cy="30%" rx="35%" ry="35%">
                        <Stop offset="0%" stopColor="white" stopOpacity="0.4" />
                        <Stop offset="100%" stopColor="transparent" />
                    </RadialGradient>
                </Defs>

                {/* CAPA 1: MARCO Y FONDO (Atrás de todo) */}
                <G>
                    <Circle cx={CENTER} cy={CENTER} r={CENTER - (BEZEL_SIZE / 4)} fill="none" stroke="url(#bezelOuter)" strokeWidth={BEZEL_SIZE / 2} />
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS + (BEZEL_SIZE / 4)} fill="none" stroke="url(#bezelInner)" strokeWidth={BEZEL_SIZE / 2} />
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill={GAUGE_THEME.colors.bg} />
                </G>

                {/* CAPA 2: CONTENIDO DINÁMICO (Escalas, Agujas, Arcos) */}
                <G>{children}</G>

                {/* CAPA 3: HUB CENTRAL (Opcional, sobre la aguja) */}
                {showHub && (
                    <G pointerEvents="none">
                        <Circle cx={CENTER + 1} cy={CENTER + 1} r={size * 0.048} fill="rgba(0,0,0,0.5)" />
                        <Circle cx={CENTER} cy={CENTER} r={size * 0.045} fill="url(#hub3D)" stroke="#444" strokeWidth="1" />
                    </G>
                )}

                {/* CAPA 4: CRISTAL Y REFLEJOS (Encima de todo) */}
                <G pointerEvents="none">
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#vesselGlass)" />
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#vesselFlare)" />
                </G>
            </Svg>
        </View>
    );
};

export default VesselGaugeFrame;