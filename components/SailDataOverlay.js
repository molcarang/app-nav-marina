import { StyleSheet, Text, View } from 'react-native';
import RudderGauge from './gauges/RudderGauge';
import VMGNavigator from './VMGNavigator';
const DataField = ({ label, value, color, vmg, targetVMG, size }) => (
    <View style={styles.dataField}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={[styles.fieldValue, { color }]}>{value}</Text>
    </View>
);

const SailDataOverlay = ({ rudderAngle, rudderLimit, size, vmg, targetVMG }) => {
    return (
        <>
            <RudderGauge
                angle={rudderAngle}
                size={size}
                alertAngle={rudderLimit} // Ángulo de alerta personalizado para vela
            />
            <VMGNavigator
                vmg={vmg}
                targetVMG={targetVMG}
                size={size}
            />
        </>
    );
};

// Estilos consistentes con tu ControlPanelBase
const styles = StyleSheet.create({
    dataField: { alignItems: 'center', flex: 1 },
    fieldLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase' },
    fieldValue: { fontSize: 22, fontWeight: 'bold' },
});

export default SailDataOverlay;