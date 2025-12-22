import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Path, Svg } from 'react-native-svg';


// --- CONFIGURACIÓN ESTÁTICA ---
const DOT_SIZE = 12;
const FONT_FAMILY = 'NauticalFont';

const DataSquare = ({
    label,
    value,
    unit,
    color,
    textColor,
    showStatusDot = false,
    statusDotColor = 'red',
    showProgressBar = false,
    showHistory = false,
    maxValue = 0,
    onPress
}) => {
    // 1. DIMENSIONES REACTIVAS
    const { width: windowWidth } = useWindowDimensions();
   const SQUARE_WIDTH = (windowWidth * 0.9) / 3;
    const SQUARE_HEIGHT = SQUARE_WIDTH * 0.9;
    
    // Dimensiones internas para el gráfico
    const chartW = SQUARE_WIDTH * 0.75;
    const chartH = 50;

    // 2. ESTADOS Y REFERENCIAS
    const [history, setHistory] = useState([]);
    const animatedHeight = useRef(new Animated.Value(0)).current;
    
    const numericValue = parseFloat(value) || 0;
    const isRecord = maxValue > 0 && numericValue >= maxValue;
    const labelUnitColor = textColor || '#79f17bff';

    // 3. LÓGICA DE DIBUJO (PATH SVG)
    const getSmoothPath = (data, width, height, range) => {
        if (data.length < 2) return "";
        const points = data.map((val, index) => ({
            x: (index / (data.length - 1)) * width,
            y: height - (Math.min(val / (range || 1), 1) * (height - 5))
        }));

        return points.reduce((acc, point, i, a) => {
            if (i === 0) return `M ${point.x},${point.y}`;
            const cp1x = a[i - 1].x + (point.x - a[i - 1].x) / 2;
            return `${acc} C ${cp1x},${a[i - 1].y} ${cp1x},${point.y} ${point.x},${point.y}`;
        }, "");
    };

    // 4. EFECTOS
    useEffect(() => {
        const target = maxValue > 0 ? Math.min((numericValue / maxValue) * 100, 100) : 0;
        Animated.timing(animatedHeight, {
            toValue: target,
            duration: 800,
            useNativeDriver: false,
        }).start();
    }, [numericValue, maxValue]);

    useEffect(() => {
        if (showHistory && numericValue >= 0) {
            setHistory(prev => {
                const newHistory = [...prev, numericValue];
                return newHistory.length > 40 ? newHistory.slice(1) : newHistory;
            });
        }
    }, [numericValue, showHistory]);

    // 5. ANIMACIONES DE ESTILO
    const heightInterpolated = animatedHeight.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
    const opacityInterpolated = animatedHeight.interpolate({ inputRange: [0, 100], outputRange: [0.3, 1] });
    const glowInterpolated = animatedHeight.interpolate({ inputRange: [0, 100], outputRange: [0, 8] });

    const handlePress = () => {
        if (showHistory) setHistory([]);
        if (onPress) onPress();
    };

    return (
        <View style={[styles.container, { width: SQUARE_WIDTH, height: SQUARE_HEIGHT, backgroundColor: color }]}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePress}
                disabled={!onPress}
                style={styles.touchable}
            >
                {/* BARRA DE PROGRESO LATERAL */}
                {showProgressBar && (
                    <View style={styles.progressContainer}>
                        <View style={styles.maxMarker} />
                        <Animated.View style={[
                            styles.progressBar,
                            {
                                height: heightInterpolated,
                                opacity: opacityInterpolated,
                                backgroundColor: isRecord ? '#FFD700' : '#79f17bff',
                                shadowColor: isRecord ? '#FFD700' : '#79f17bff',
                                shadowRadius: glowInterpolated,
                            }
                        ]} />
                    </View>
                )}

                {/* GRÁFICO HISTÓRICO FONDO */}
                {showHistory && history.length > 1 && (
                    <View style={styles.chartWrapper} pointerEvents="none">
                        <Svg height={chartH} width={chartW}>
                            <Path
                                d={`${getSmoothPath(history, chartW, chartH, maxValue || 15)} L ${chartW},${chartH} L 0,${chartH} Z`}
                                fill={isRecord ? "rgba(255, 215, 0, 0.15)" : "rgba(121, 241, 123, 0.15)"}
                            />
                            <Path
                                d={getSmoothPath(history, chartW, chartH, maxValue || 15)}
                                fill="none"
                                stroke={isRecord ? "rgba(255, 215, 0, 0.6)" : "rgba(121, 241, 123, 0.6)"}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        </Svg>
                    </View>
                )}

                {/* CONTENIDO: ETIQUETA + DOT */}
                <View style={styles.labelWrapper}>
                    <Text style={[styles.label, { color: labelUnitColor, fontSize: SQUARE_WIDTH * 0.13 }]}>
                        {label}
                    </Text>
                    {showStatusDot && <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />}
                </View>

                {/* VALOR PRINCIPAL (Escalado dinámico) */}
                <Text style={[styles.value, { fontSize: SQUARE_WIDTH * 0.28 }]}>
                    {value}
                </Text>

                {/* UNIDAD */}
                <Text style={[styles.unit, { color: labelUnitColor, fontSize: SQUARE_WIDTH * 0.13 }]}>
                    {unit}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 15,
        margin: 3,
        elevation: 10,
        overflow: 'hidden',
    },
    touchable: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    labelWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontFamily: FONT_FAMILY,
        fontWeight: '300',
        marginRight: 6,
    },
    statusDot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
    },
    value: {
        fontFamily: FONT_FAMILY,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    unit: {
        fontFamily: FONT_FAMILY,
        fontWeight: '600',
    },
    progressContainer: {
        position: 'absolute',
        left: 8,
        top: 20,
        bottom: 20,
        width: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 3,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    progressBar: {
        width: '100%',
        borderRadius: 3,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
    },
    maxMarker: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1.5,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        zIndex: 5,
    },
    chartWrapper: {
        position: 'absolute',
        bottom: '25%',
        alignSelf: 'center',
        zIndex: -1,
        opacity: 0.7,
    }
});

export default DataSquare;