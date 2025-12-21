import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

// ... (tus constantes DOT_SIZE y FONT_FAMILY)

// Parámetros del dot
const DOT_SIZE = 12; // Un poco más grande para esta versión
const FONT_FAMILY = 'NauticalFont';

/**
 * Componente reutilizable para mostrar un valor digital en un cuadrado redondeado.
 * @param {string} label - Etiqueta superior (ej. AWS, SOG).
 * @param {string | number} value - El dato principal (ej. 4.2, 230).
 * @param {string} unit - La unidad de medida (ej. Nudos, V).
 * @param {string} color - Color de fondo del cuadrado.
 * @param {string} textColor - Color del texto del valor principal (opcional, si no, usa el color de la unidad).
 * * 🚨 NUEVAS PROPIEDADES PARA EL INDICADOR DE ESTADO
 * @param {boolean} showStatusDot - Si es true, muestra un punto de estado.
 * @param {string} statusDotColor - Color del punto de estado ('red', 'green', etc.).
 */
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

    const getSmoothPath = (data, width, height, range) => {
        if (data.length < 2) return "";

        const points = data.map((val, index) => ({
            x: (index / (data.length - 1)) * width,
            y: height - (Math.min(val / range, 1) * (height - 5))
        }));

        return points.reduce((acc, point, i, a) => {
            if (i === 0) return `M ${point.x},${point.y}`;

            // Calculamos los puntos de control para la curva
            const cp1x = a[i - 1].x + (point.x - a[i - 1].x) / 2;
            return `${acc} C ${cp1x},${a[i - 1].y} ${cp1x},${point.y} ${point.x},${point.y}`;
        }, "");
    };
    const animatedHeight = useRef(new Animated.Value(0)).current;
    const numericValue = parseFloat(value) || 0;
    const isRecord = numericValue >= maxValue && maxValue > 0;
    const targetPercentage = maxValue > 0
        ? Math.min((numericValue / maxValue) * 100, 100)
        : 0;

    const progressHeight = maxValue > 0
        ? Math.min((numericValue / maxValue) * 100, 100)
        : 0;
    // ----
    // El estilo del contenedor principal se actualiza con la prop 'color'
    const containerStyle = {
        ...styles.container,
        backgroundColor: color,
    };

    // Definición de color para el label/unit, si no se provee textColor
    const labelUnitColor = textColor || styles.label.color;
    const [history, setHistory] = useState([]);


    useEffect(() => {
        Animated.timing(animatedHeight, {
            toValue: targetPercentage,
            duration: 800, // Duración del "llenado" en milisegundos
            useNativeDriver: false, // Obligatorio para animar altura (layout)
        }).start();
    }, [targetPercentage]); // Se ejecuta cada vez que el valor o el máximo cambian

    useEffect(() => {
        // Solo guardamos si el valor es mayor a 0 (para evitar rayas raras al inicio)
        if (showHistory && numericValue >= 0) {
            setHistory(prev => {
                const newHistory = [...prev, numericValue];
                // Mantenemos los últimos 40 puntos para que el gráfico sea fluido
                return newHistory.length > 40 ? newHistory.slice(1) : newHistory;
            });
        }
    }, [numericValue, showHistory]);


    const heightStyle = animatedHeight.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });
    const opacityStyle = animatedHeight.interpolate({
        inputRange: [0, 100],
        outputRange: [0.3, 1], // 0.3 es tenue (poca velocidad), 1 es brillo total (máxima)
    });
    const glowStyle = animatedHeight.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 8], // A más velocidad, más aura de luz alrededor
    });

    const handlePress = () => {
        // 1. Limpiamos el gráfico (estado local de DataSquare)
        if (showHistory) {
            setHistory([]);
        }
        // 2. Avisamos al padre (SignalKConnector) para resetear el récord
        if (onPress) {
            onPress();
        }
    };
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePress}
            disabled={!onPress} // Si no hay función, no hace efecto botón
            style={containerStyle}
        >
            {showProgressBar && (
                <View style={styles.progressContainer}>
                    {/* Línea blanca fija en el tope (100%) */}
                    <View style={styles.maxMarker} />

                    {/* Barra de progreso con color dinámico */}
                    <Animated.View style={[
                        styles.progressBar,
                        {
                            height: heightStyle,
                            opacity: opacityStyle, // 👈 Aquí aplicamos el fade in dinámico
                            backgroundColor: isRecord ? '#FFD700' : '#79f17bff',
                            shadowColor: isRecord ? '#FFD700' : '#79f17bff',
                            shadowRadius: glowStyle, // 👈 El brillo también crece con la velocidad
                        }
                    ]} />
                </View>
            )}

            {showHistory && history.length > 1 && (
                <View style={styles.chartContainer} pointerEvents="none">
                    <Svg height="100%" width="100%">
                        {/* 1. ÁREA SUAVIZADA (Relleno) */}
                        <Path
                            d={`${getSmoothPath(history, 185, 60, maxValue > 0 ? maxValue : 15)} L 185,60 L 0,60 Z`}
                            fill={isRecord ? "rgba(255, 215, 0, 0.15)" : "rgba(121, 241, 123, 0.15)"}
                        />

                        {/* 2. LÍNEA SUAVIZADA (Borde) */}
                        <Path
                            d={getSmoothPath(history, 185, 60, maxValue > 0 ? maxValue : 15)}
                            fill="none"
                            stroke={isRecord ? "rgba(255, 215, 0, 0.6)" : "rgba(121, 241, 123, 0.6)"}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                    </Svg>
                </View>
            )}

            {/* 🚨 Contenedor para alinear la Etiqueta y el Dot */}

            <View style={styles.labelContainer}>

                {/* Etiqueta */}
                {/* Usamos labelUnitColor para el color del label, basado en el color original o textColor */}
                <Text style={[styles.label, { color: labelUnitColor }]}>{label}</Text>

                {/* 🚨 INDICADOR DE ESTADO (Status Dot) */}
                {showStatusDot && (
                    <View style={[
                        styles.statusDot,
                        { backgroundColor: statusDotColor }
                    ]} />
                )}
            </View>

            {/* Valor principal */}
            <Text style={styles.value}>{value}</Text>

            {/* Unidad */}
            {/* Usamos labelUnitColor para el color de la unidad */}
            <Text style={[styles.unit, { color: labelUnitColor }]}>{unit}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 225,
        height: 225,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'space-around',
        margin: 3,
        elevation: 100,
        fontFamily: FONT_FAMILY,
    },
    chartContainer: {
        position: 'absolute',
        bottom: 30,         // Ajusta según donde esté tu unidad (KTS)
        left: 20,
        right: 20,
        height: 50,         // Altura del área del gráfico
        zIndex: -1,         // Por detrás de todo
        opacity: 0.6,
    },

    progressContainer: {
        position: 'absolute',
        left: 12,
        top: 25,
        bottom: 25,
        width: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.03)', // Casi invisible para que destaque el brillo
        justifyContent: 'flex-end',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        width: '100%',
        borderRadius: 4,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1, // Mantenemos la opacidad de la sombra al máximo
    },
    maxMarker: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        zIndex: 10,
    },
    // 🚨 Nuevo contenedor para alinear la etiqueta y el punto
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // Aseguramos que ocupe el ancho necesario para centrarse
    },

    label: {
        fontFamily: FONT_FAMILY,
        fontSize: 30,
        color: '#79f17bff', // Color por defecto si no se pasa textColor
        fontWeight: '300',
        marginRight: 8, // Espacio entre Label y Dot
    },

    // 🚨 Estilos para el Status Dot
    statusDot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        // El color de fondo se define mediante la prop statusDotColor
    },

    value: {
        fontFamily: FONT_FAMILY,
        fontSize: 65,
        color: '#ffffffff',
        fontWeight: 'bold',
        marginTop: 5,
    },
    unit: {
        fontFamily: FONT_FAMILY,
        fontSize: 30,
        color: '#79f17bff', // Color por defecto
        fontWeight: '600',
    },
});

export default DataSquare;