import { StyleSheet, View } from 'react-native';
import RudderGauge from './gauges/RudderGauge';
import VMGNavigator from './gauges/VMGNavigator';
import WindShiftGauge from './gauges/WindShiftGauge';
import { useWindTactic } from '../hooks/useWindTactic';

const SailDataOverlay = ({ rudderAngle, rudderLimit, size, vmg, targetVMG, twd }) => {
    const { meanTWD } = useWindTactic(twd, 5);
    return (
        /* Cambiamos el Fragmento por un View contenedor con flex */
        <View style={styles.overlayContainer}>

            {/* PRIMERA FILA: Rudder y VMG */}
            <View style={styles.row}>
                <RudderGauge
                    angle={rudderAngle}
                    size={size}
                    alertAngle={rudderLimit}
                />
                <VMGNavigator
                    currentTWD={twd} 
                    meanTWD={meanTWD} 
                    size={size}
                />
            </View>

            {/* SEGUNDA FILA: WindShift */}
            <View style={[styles.row, styles.secondRow]}>
                <WindShiftGauge
                    currentTWD={twd}
                    meanTWD={meanTWD}
                    size={size}
                />
                {/* Aquí podrías añadir otro gauge en el futuro para equilibrar la fila */}
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    overlayContainer: {
        width: '100%',
        flexDirection: 'column', // Asegura que las filas se apilen verticalmente
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-around',
        paddingVertical: 10, // Espacio interno para que no se peguen
    },
    secondRow: {
        marginTop: 10, // Espacio extra entre la fila 1 y la 2
    }
});

export default SailDataOverlay;