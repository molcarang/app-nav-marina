import { StyleSheet, Text, View } from 'react-native';

const InfoPanel = ({ dataArray, color }) => {
    return (
        <View style={[styles.panelContainer, { backgroundColor: color }]}>
            {dataArray.map((item, index) => (
                <View key={index} style={styles.dataRow}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={[styles.rowValue, { color: item.color || '#fff' }]}>
                        {item.value}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    panelContainer: {
        width: 225,
        // Eliminamos height: 225
        borderRadius: 15,
        padding: 15,
        paddingBottom: 10, // Un poco menos de espacio abajo
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'flex-start', // 👈 Importante: hace que no se estire verticalmente
    },
    panelTitle: {
        color: '#aaa',
        fontFamily: 'NauticalFont',
        fontSize: 16,
        marginBottom: 12,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 5,
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
    },
    rowValue: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'NauticalFont',
    },
});

export default InfoPanel;