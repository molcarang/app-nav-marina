import { useEffect, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Animated, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import HistoryChartModal from './charts/HistoryChartModal';
import { getHistoryChart } from './charts/historyPath';


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
    onReset,
    onPress,
    soundMuted = false,
    showHistoryPopup = false,
    historySamples,
    historyHours = 2,
    isNightMode = false,
    width,
    height
}) => {
    // 1. DIMENSIONES REACTIVAS
    const { width: windowWidth } = useWindowDimensions();
    const SQUARE_WIDTH = width ?? (windowWidth * 0.9) / 3;
    const SQUARE_HEIGHT = height ?? SQUARE_WIDTH * 0.9;
    const fontBasis = height == null ? SQUARE_WIDTH : Math.min(SQUARE_WIDTH, SQUARE_HEIGHT / 0.9);

    // Dimensiones internas para el gráfico
    const chartW = SQUARE_WIDTH * 0.75;
    const chartH = 50;

    // 2. ESTADOS Y REFERENCIAS
    const [localHistory, setHistory] = useState([]);
    const history = historySamples ?? localHistory;
    const [historyOpen, setHistoryOpen] = useState(false);
    const lastTap = useRef(null);
    const pressStarted = useRef(0);
    const resetTriggered = useRef(false);
    const animatedHeight = useRef(new Animated.Value(0)).current;

    const numericValue = parseFloat(value) || 0;
    const isRecord = maxValue > 0 && numericValue >= maxValue;
    const labelUnitColor = textColor || '#79f17bff';

    const historyRange = Math.max(Number(maxValue) || 15, ...history.map(sample => typeof sample === 'object' ? sample.value : sample));
    const historyChart = getHistoryChart(history, chartW, chartH, historyRange, Date.now(), historyHours);

    // 4. EFECTOS
    useEffect(() => {
        const target = maxValue > 0 ? Math.min((numericValue / maxValue) * 100, 100) : 0;
        Animated.timing(animatedHeight, {
            toValue: target,
            duration: 800,
            useNativeDriver: false,
        }).start();
    }, [numericValue, maxValue, animatedHeight]);

    useEffect(() => {
        if (historySamples === undefined && showHistory && numericValue >= 0) {
            setHistory(prev => {
                if (prev.length > 0 && prev[prev.length - 1] === numericValue) return prev;
                const newHistory = [...prev, numericValue];
                return newHistory.length > 40 ? newHistory.slice(1) : newHistory;
            });
        }
    }, [numericValue, showHistory, historySamples]);

    // Limpiar historial solo cuando showHistory cambia a false
    useEffect(() => {
        if (!showHistory) setHistory([]);
    }, [showHistory]);

    // 5. ANIMACIONES DE ESTILO
    const heightInterpolated = animatedHeight.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
    const opacityInterpolated = animatedHeight.interpolate({ inputRange: [0, 100], outputRange: [0.3, 1] });
    const glowInterpolated = animatedHeight.interpolate({ inputRange: [0, 100], outputRange: [0, 8] });

    const handleReset = () => {
        resetTriggered.current = true;
        lastTap.current = null;
        if (showHistory) setHistory([]);
        if (onReset) onReset();
    };
    const handleTap = () => {
        if (onPress) onPress();
        if (!showHistoryPopup) return;
        const now = Date.now();
        if (resetTriggered.current || now - pressStarted.current > 350) {
            lastTap.current = null;
            return;
        }
        if (lastTap.current !== null && now - lastTap.current <= 350) {
            lastTap.current = null;
            setHistoryOpen(true);
        } else lastTap.current = now;
    };

    return (
        <View style={[styles.container, { width: SQUARE_WIDTH, height: SQUARE_HEIGHT, backgroundColor: color, borderWidth: 1, borderColor: labelUnitColor }]}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPressIn={() => { pressStarted.current = Date.now(); resetTriggered.current = false; }}
                onPress={handleTap}
                onLongPress={onReset ? handleReset : undefined}
                delayLongPress={3000}
                disabled={!onReset && !showHistoryPopup && !onPress}
                accessibilityRole={onReset || showHistoryPopup || onPress ? 'button' : undefined}
                accessibilityLabel={onPress ? `${label}, ${value} ${unit}. ${soundMuted ? 'Alarma silenciada temporalmente' : 'Silenciar alarma un minuto'}` : undefined}
                accessibilityHint={showHistoryPopup ? 'Dos toques rápidos abren el historial. Mantén pulsado 3 segundos para reiniciar.' : onReset ? 'Mantén pulsado durante 3 segundos para reiniciar el máximo y el historial.' : undefined}
                accessibilityActions={showHistoryPopup ? [{ name: 'showHistory', label: 'Abrir historial' }] : undefined}
                onAccessibilityAction={event => { if (event.nativeEvent.actionName === 'showHistory') setHistoryOpen(true); }}
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
                                d={historyChart.area}
                                fill={isRecord ? "rgba(255, 215, 0, 0.15)" : "rgba(121, 241, 123, 0.15)"}
                            />
                            <Path
                                d={historyChart.line}
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
                    <Text style={[styles.label, { color: labelUnitColor, fontSize: fontBasis * 0.13 }]}>
                        {label}
                    </Text>
                    {showStatusDot && <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />}
                    {soundMuted && <Feather name="bell-off" size={fontBasis * 0.15} color={labelUnitColor} />}
                </View>

                {/* VALOR PRINCIPAL (Escalado dinámico) */}
                <Text style={[styles.value, { fontSize: fontBasis * 0.28 }]}>
                    {value}
                </Text>

                {/* UNIDAD */}
                <Text style={[styles.unit, { color: labelUnitColor, fontSize: fontBasis * 0.13 }]}>
                    {unit}
                </Text>
            </TouchableOpacity>
            {showHistoryPopup && historyOpen && (
                <HistoryChartModal visible onClose={() => setHistoryOpen(false)} history={history}
                    label={label} unit={unit} value={value} maxValue={maxValue} isNightMode={isNightMode} historyHours={historyHours} />
            )}
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
        left: 4,
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
