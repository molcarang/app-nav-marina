import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const getFontSizes = (width) => {
    // Ajusta los tamaños de fuente proporcionalmente al ancho del panel
    return {
        label: Math.round(width * 0.07),
        value: Math.round(width * 0.09),
    };
};

const InfoPanel = ({ dataArray, color, width = 225 }) => {
    const fontSizes = getFontSizes(width);
    const { width: windowWidth } = useWindowDimensions();
    const SQUARE_WIDTH = (windowWidth * 0.9) / 3;
    return (

        <View style={[styles.panelContainer, {
            backgroundColor: color, width: SQUARE_WIDTH,
        }]}>
            {dataArray.map((item, index) => (
                <View key={index} style={styles.dataRow}>
                    <Text style={[styles.rowLabel, { fontSize: fontSizes.label }]}>{item.label}</Text>
                    <Text style={[styles.rowValue, { color: item.color || '#fff', fontSize: fontSizes.value }]}>
                        {item.value}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    panelContainer: {
        // width se controla por prop
        borderRadius: 15,
        margin: 3, // Igual que DataSquare
        padding: 15,
        paddingBottom: 10, // Un poco menos de espacio abajo
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'flex-start', // 👈 Importante: hace que no se estire verticalmente
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    rowLabel: {
        color: '#888',
        fontSize: 14,
        fontFamily: 'NauticalFont',
        textAlign: 'left',
        marginLeft: -12,
        
    },
    rowValue: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'NauticalFont',
        textAlign: 'right',
    },
});

export default InfoPanel;