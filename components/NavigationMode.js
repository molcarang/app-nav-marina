import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Ellipse, G, Line, Rect } from 'react-native-svg';
import { GAUGE_THEME } from '../styles/GaugeTheme';
import { GaugeDefs } from './gauges/shared/GaugeDefs';
import EngineIcon from './icons/EngineIcon';
import SailIcon from './icons/SailIcon';

const NavigationMode = React.memo(({ isSail }) => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const isLandscape = windowWidth > windowHeight;
    const navWidth = isLandscape ? windowWidth * 0.7 : windowWidth * 0.9;
    const navHeight = isLandscape ? windowHeight * 0.12 : windowHeight * 0.065;

    const sailColor = GAUGE_THEME.colors.sail;
    const engineColor = GAUGE_THEME.colors.engine;
    const inactiveColor = "rgba(255, 255, 255, 0.15)";

    const fontSize = Math.min(Math.max(navHeight * 0.25, 11), 28);
    const fontCaptionSize = fontSize * 1; // Un poco más grande para legibilidad

    return (
        <View style={{ width: navWidth, height: navHeight, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={navWidth} height={navHeight} viewBox={`0 0 ${navWidth} ${navHeight}`}>
                <Defs>
                    <GaugeDefs />
                </Defs>
                {/* --- CAPA 1: MARCO METÁLICO --- */}
                <G>
                    <Rect x="3" y="3" width={navWidth - 6} height={navHeight - 6} rx={14} fill={GAUGE_THEME.colors.bg} />
                </G>
            </Svg>

            {/* --- CAPA 3: INTERFAZ EN 3 COLUMNAS --- */}
            <View style={styles.overlay}>
                <View style={styles.mainContainer}>

                    {/* COLUMNA IZQUIERDA: SAIL */}
                    <View style={styles.columnSide}>
                        <View style={[styles.modeGroup, isSail && styles.activeContainer]}>
                            <View style={styles.labelRow}>
                                <SailIcon color={isSail ? sailColor : inactiveColor} 
                                size={fontSize * 1.4} style={{ marginRight: 6 }} />
                                <View style={styles.textWrapper}>
                                    <Text numberOfLines={1} adjustsFontSizeToFit 
                                    style={[styles.modeText, { color: isSail ? sailColor : inactiveColor, fontSize: fontCaptionSize }]}>
                                        SAIL
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.led, { backgroundColor: isSail ? sailColor : '#111', shadowColor: sailColor }]} />
                        </View>
                    </View>

                    {/* COLUMNA CENTRAL: SEPARADOR (Espacio de seguridad) */}
                    <View style={styles.columnCenter} />

                    {/* COLUMNA DERECHA: ENGINE */}
                    <View style={styles.columnSide}>
                        <View style={[styles.modeGroup, !isSail && styles.activeContainer]}>
                            <View style={styles.labelRow}>
                                <EngineIcon color={!isSail ? engineColor : inactiveColor} size={fontSize * 1.4} style={{ marginRight: 6 }} />
                                <View style={styles.textWrapper}>
                                    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.modeText, { color: !isSail ? engineColor : inactiveColor, fontSize: fontCaptionSize }]}>
                                        ENGINE
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.led, { backgroundColor: !isSail ? engineColor : '#111', shadowColor: engineColor }]} />
                        </View>
                    </View>

                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainContainer: {
        flexDirection: 'row',
        width: '90%',
        height: '100%',
    },
    columnSide: {
        flex: 4.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    columnCenter: {
        flex: 1,
    },
    modeGroup: {
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.3,
        width: '100%',
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    textWrapper: {
        flexShrink: 1,
    },
    activeContainer: {
        opacity: 1,
        transform: [{ scale: 1.05 }],
    },
    modeText: {
        fontFamily: 'NauticalFont',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    led: {
        width: 16,
        height: 2.5,
        borderRadius: 2,
        marginTop: 5,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 5,
        elevation: 5,
    }
});

export default NavigationMode;