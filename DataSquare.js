import { StyleSheet, Text, View } from 'react-native';

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
    statusDotColor = 'red'
}) => {

    // El estilo del contenedor principal se actualiza con la prop 'color'
    const containerStyle = {
        ...styles.container,
        backgroundColor: color,
    };

    // Definición de color para el label/unit, si no se provee textColor
    const labelUnitColor = textColor || styles.label.color;

    return (
        <View style={containerStyle}>

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
        </View>
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