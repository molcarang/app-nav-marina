import { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

/** Azul profundo y curvas batimétricas decorativas, atenuadas en modo nocturno. */
export default function ConsoleBackground({ isNightMode }) {
    const id = `console-${useId().replace(/:/g, '')}`;
    const [size, setSize] = useState({ width: 0, height: 0 });
    const updateSize = ({ nativeEvent: { layout } }) => {
        setSize(previous => previous.width === layout.width && previous.height === layout.height
            ? previous
            : { width: layout.width, height: layout.height });
    };

    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject} onLayout={updateSize}>
            <Svg width={size.width} height={size.height}>
                <Defs>
                    <LinearGradient id={`${id}-base`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={isNightMode ? '#110b0b' : '#102b3c'} />
                        <Stop offset="55%" stopColor={isNightMode ? '#090606' : '#091a29'} />
                        <Stop offset="100%" stopColor={isNightMode ? '#050303' : '#040c16'} />
                    </LinearGradient>
                    <RadialGradient id={`${id}-light`} cx="30%" cy="0%" rx="75%" ry="85%">
                        <Stop offset="0%" stopColor={isNightMode ? '#713333' : '#4baaa9'} stopOpacity={isNightMode ? 0.06 : 0.13} />
                        <Stop offset="100%" stopColor={isNightMode ? '#713333' : '#4baaa9'} stopOpacity={0} />
                    </RadialGradient>
                    {/* Trama fija de 8 puntos: conserva su detalle al cambiar de pantalla. */}
                    <Pattern id={`${id}-weave`} width={8} height={8} patternUnits="userSpaceOnUse">
                        <Path d="M0 1 H8 M0 5 H8" stroke="#000" strokeWidth={1} strokeOpacity={0.22} />
                        <Path d="M1 0 V8 M5 0 V8" stroke="#000" strokeWidth={1} strokeOpacity={0.16} />
                        <Path d="M0 0 H3 M4 4 H7 M0 1 V3 M4 5 V7"
                            stroke={isNightMode ? '#946060' : '#9abdc8'} strokeWidth={0.7} strokeOpacity={0.16} />
                    </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill={`url(#${id}-base)`} />
                <Rect width="100%" height="100%" fill={`url(#${id}-light)`} />
                <Rect width="100%" height="100%" fill={`url(#${id}-weave)`} opacity={isNightMode ? 0.3 : 0.7} />
            </Svg>
            {/* Ajusta las curvas a todo el panel sin recortarlas al cambiar de orientación. */}
            <Svg style={StyleSheet.absoluteFillObject} width={size.width} height={size.height} viewBox="0 0 1200 800" preserveAspectRatio="none">
                <G fill="none" stroke={isNightMode ? '#713333' : '#70b8bf'} strokeWidth={1} opacity={isNightMode ? 0.035 : 0.075}>
                    <Path d="M-100 480 C140 300 270 630 510 470 S880 180 1300 330" />
                    <Path d="M-100 510 C150 320 285 665 525 505 S900 205 1300 365" />
                    <Path d="M-100 545 C160 345 305 705 545 545 S920 235 1300 405" />
                    <Path d="M-100 585 C175 375 330 750 570 590 S945 270 1300 450" />
                    <Path d="M-100 635 C195 415 360 800 600 640 S970 310 1300 500" />
                    <Path d="M-100 695 C220 465 395 860 635 700 S1000 360 1300 560" />
                </G>
            </Svg>
        </View>
    );
}
