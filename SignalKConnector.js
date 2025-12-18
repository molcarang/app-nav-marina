import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { ImageBackground, Modal, Platform, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DataSquare from './DataSquare';
import HeadingGauge from './HeadingGauge';
import { useSignalKData } from './useSignalKData';

const mpsToKnots = (mps) => (mps * 1.94384).toFixed(1);
const radToDeg = (rad) => (rad * 57.2958);
const normalizeAngle = (angle) => {
    angle = angle % 360;
    if (angle > 180) angle -= 360;
    else if (angle <= -180) angle += 360;
    return angle;
};


const SignalKConnector = () => {
    // --- ESTADOS (HOOKS) ---
    const data = useSignalKData();
    const [isModalVisible, setModalVisible] = useState(false);
    const [isNightMode, setIsNightMode] = useState(false);
    const [depthThreshold, setDepthThreshold] = useState(3.0);
    // 1. AHORA EL ESTADO ESTÁ AQUÍ DENTRO
    const [ajustesConsola, setAjustesConsola] = useState({
        minAnguloCeñida: 20,
        maxAnguloCeñida: 60,
    });

    // 2. FUNCIÓN PARA VALIDAR Y GUARDAR AJUSTES    
    const validarYGuardar = async (clave, valor) => {
        let num = parseInt(valor) || 0;
        let nuevosAjustes = { ...ajustesConsola };

        if (clave === 'minAnguloCeñida') {
            if (num < 10) num = 10;
            if (num > 90) num = 90;
            nuevosAjustes.minAnguloCeñida = num;
            if (nuevosAjustes.maxAnguloCeñida <= num) {
                nuevosAjustes.maxAnguloCeñida = num + 5;
            }
        } else if (clave === 'maxAnguloCeñida') {
            if (num <= nuevosAjustes.minAnguloCeñida) {
                num = nuevosAjustes.minAnguloCeñida + 5;
            }
            nuevosAjustes.maxAnguloCeñida = num;
        }

        // Ahora React no dará error porque setAjustesConsola 
        // se llama dentro del ámbito correcto del componente
        setAjustesConsola(nuevosAjustes);

        try {
            await AsyncStorage.setItem('@ajustes_consola', JSON.stringify(nuevosAjustes));
        } catch (e) {
            console.error("Error guardando", e);
        }
    };

    // --- Lógica de procesamiento de datos ---
    const awsKnots = mpsToKnots(data['environment.wind.speedApparent']);
    const sogKnots = mpsToKnots(data['navigation.speedOverGround']);
    const cogRad = data['navigation.headingTrue'];
    let cogDegrees = 0;
    let cogDigital = '---';
    let cogDegreesSquare = '---';

    if (typeof cogRad === 'number' && !isNaN(cogRad)) {
        cogDegrees = radToDeg(cogRad);
        cogDigital = cogDegrees.toFixed(1);
        cogDegreesSquare = cogDegrees.toFixed(0).toString().concat('°');
    }

    const twdRad = data['environment.wind.directionTrue'];
    const twdDegrees = radToDeg(twdRad);
    const twdDigital = !isNaN(twdDegrees)
        ? Math.abs(normalizeAngle(twdDegrees)).toFixed(0) + '°'
        : '---';

    let twaCogDegrees = null;
    if (!isNaN(twdDegrees) && !isNaN(cogDegrees)) {
        twaCogDegrees = normalizeAngle(twdDegrees - cogDegrees);
    }

    const minLay = ajustesConsola.minAnguloCeñida; 
    const maxLay = ajustesConsola.maxAnguloCeñida;
    const absTWA = Math.abs(twaCogDegrees || 0);
    const colorEstado = (absTWA >= minLay && absTWA <= maxLay) ? '#00FF00' : '#FF0000';

    const depthMeters = data['navigation.depthBelowTransducer'] || 0;
    const isDepthAlarmActive = depthMeters < depthThreshold && depthMeters > 0;

    const headingColor = '#dc1212ff';
    const windColor = isNightMode ? '#900' : '#ff9800';
    const twdColor = isNightMode ? '#004' : '#2196f3';
    const dataSquareBg = isNightMode ? 'rgba(30, 0, 0, 0.8)' : 'rgba(45, 45, 45, 0.75)';
    const alarmBgColor = 'rgba(210, 0, 0, 0.95)';

    return (
        <View style={[styles.container, { backgroundColor: isNightMode ? '#050000' : '#0a0a0a' }]}>
            <View style={styles.header}>
                <Text style={[styles.status, { color: isNightMode ? '#400' : '#666' }]}>
                    {data.isConnected ? 'SIGNAL K: OK ✅' : 'SIN CONEXIÓN 🔴'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.settingsBtn}>
                    <MaterialIcons name="settings" size={28} color={isNightMode ? "#600" : "#aaa"} />
                </TouchableOpacity>
            </View>

            <View style={[styles.consoleFrame, isNightMode && styles.consoleFrameNight]}>
                <ImageBackground
                    source={require('./assets/images/CarbonFiber.png')}
                    style={styles.gridBackground}
                    resizeMode="repeat"
                    imageStyle={{ borderRadius: 25, opacity: isNightMode ? 0.3 : 1 }}
                >
                    <View style={styles.dataGrid}>
                        <HeadingGauge
                            headingColor={headingColor}
                            value={cogDigital}
                            unit="°COG"
                            twd={twdDegrees}
                            twaCog={twaCogDegrees}
                            isNightMode={isNightMode}
                            // 3. PASAMOS LOS VALORES AL COMPÁS
                            minLayline={ajustesConsola.minAnguloCeñida}
                            maxLayline={ajustesConsola.maxAnguloCeñida}
                        />

                        <View style={styles.dataGridrow}>
                            <DataSquare label="AWS" value={awsKnots} unit="KNOTS" color={dataSquareBg} />
                            <DataSquare label="SOG" value={sogKnots} unit="KNOTS" color={dataSquareBg} />
                            <DataSquare 
                            label="TWA" 
                            textColor={windColor} 
                            value={twaCogDegrees !== null ? twaCogDegrees.toFixed(0) + '°' : '---'} 
                            unit="DEG"
                            showStatusDot={true}
                            statusDotColor={colorEstado}
                            color={dataSquareBg} />
                        </View>

                        <View style={styles.dataGridrow}>
                            <DataSquare label="COG" value={cogDegreesSquare} unit="TRUE" textColor={headingColor} color={dataSquareBg} />
                            <DataSquare
                                label="DEPTH"
                                value={depthMeters.toFixed(1)}
                                unit="METERS"
                                color={isDepthAlarmActive ? alarmBgColor : dataSquareBg}
                                showStatusDot={isDepthAlarmActive}
                                statusDotColor="#fff"
                                textColor={isDepthAlarmActive ? "#fff" : undefined}
                            />
                            <DataSquare label="TWD" value={twdDigital} unit="TRUE" textColor={twdColor} color={dataSquareBg} />
                        </View>
                    </View>
                </ImageBackground>
            </View>

            {/* MODAL CONFIG */}
            <Modal animationType="fade" transparent={true} visible={isModalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>AJUSTES DE CONSOLA</Text>

                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Modo Noche (Rojo)</Text>
                            <Switch value={isNightMode} onValueChange={setIsNightMode} trackColor={{ true: "#900" }} />
                        </View>

                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Alarma Prof. ({depthThreshold}m)</Text>
                            <View style={styles.stepper}>
                                <TouchableOpacity onPress={() => setDepthThreshold(prev => Math.max(0, (prev - 0.5)))} style={styles.stepBtn}><Text style={styles.stepText}>-</Text></TouchableOpacity>
                                <TouchableOpacity onPress={() => setDepthThreshold(prev => prev + 0.5)} style={styles.stepBtn}><Text style={styles.stepText}>+</Text></TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Mín. ceñida (10-90°)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                defaultValue={ajustesConsola.minAnguloCeñida.toString()}
                                onBlur={(e) => validarYGuardar('minAnguloCeñida', e.nativeEvent.text)}
                            />
                        </View>

                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Máx. ceñida</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                defaultValue={ajustesConsola.maxAnguloCeñida.toString()}
                                onBlur={(e) => validarYGuardar('maxAnguloCeñida', e.nativeEvent.text)}
                            />
                        </View>

                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}><Text style={styles.closeBtnText}>CERRAR</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 50 : 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', width: '92%', marginBottom: 10, alignItems: 'center' },
    status: { fontSize: 12, fontWeight: 'bold' },
    input: {
        color: '#FFFFFF', // Blanco o el cian #00ffff que usamos antes
        borderBottomWidth: 1,
        borderBottomColor: '#555',
        width: 50,
        textAlign: 'center',
        fontSize: 18,
    },
    consoleFrame: {
        width: '96%',
        borderRadius: 28,
        backgroundColor: '#111',
        borderWidth: 2,
        borderTopColor: '#666',
        borderLeftColor: '#444',
        borderRightColor: '#222',
        borderBottomColor: '#000',
        overflow: 'hidden',
        elevation: 20,
    },
    consoleFrameNight: { borderTopColor: '#400', borderLeftColor: '#200', borderColor: '#100' },
    gridBackground: { width: '100%', height: '100%', alignSelf: 'stretch' },
    dataGrid: { width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.4)', paddingTop: 10, paddingBottom: 30, alignItems: 'center' },
    dataGridrow: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', paddingVertical: 5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '85%', backgroundColor: '#1a1a1a', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: '#333' },
    modalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    settingLabel: { color: '#ccc', fontSize: 16 },
    stepper: { flexDirection: 'row' },
    stepBtn: { backgroundColor: '#333', padding: 12, borderRadius: 8, marginLeft: 10, width: 45, alignItems: 'center' },
    stepText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    closeBtn: { backgroundColor: '#dc1212', padding: 15, borderRadius: 12, marginTop: 10, alignItems: 'center' },
    closeBtnText: { color: '#fff', fontWeight: 'bold' }
});

export default SignalKConnector;