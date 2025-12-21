import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    ImageBackground, Modal, Platform, ScrollView, StyleSheet,
    Switch, Text,
    TouchableOpacity, useWindowDimensions, View
} from 'react-native';
import { radToDeg, mpsToKnots, normalizeAngle } from './utils/Utils';
import Slider from '@react-native-community/slider';
// Componentes personalizados
import DataSquare from './DataSquare';
import HeadingGauge from './HeadingGauge';
import InfoPanel from './InfoPanel';
import { useSignalKData } from './useSignalKData';


const SignalKConnector = () => {
    // --- HOOKS DE DIMENSIÓN ---
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const columnWidth = (windowWidth * 0.94) / 3; // Ajustado para márgenes internos
    const gaugeSize = Math.min(windowWidth * 0.93, windowHeight * 0.45);
    // --- ESTADOS ---
    const data = useSignalKData();
    const [isModalVisible, setModalVisible] = useState(false);
    const [isNightMode, setIsNightMode] = useState(false);
    const [depthThreshold, setDepthThreshold] = useState(3.0);
    const [maxSOG, setMaxSOG] = useState(0);
    const [maxTWS, setMaxTWS] = useState(0);
    const [ajustesConsola, setAjustesConsola] = useState({
        minAnguloCeñida: 20,
        maxAnguloCeñida: 60,
    });

    // --- PROCESAMIENTO DE DATOS SIGNAL K ---
    const twsKnots = mpsToKnots(data['environment.wind.speedTrue'] || 0);
    const sogKnots = mpsToKnots(data['navigation.speedOverGround'] || 0);
    const depthMeters = data['navigation.depthBelowTransducer'] || 0;

    // Heading y Viento
    const cogRad = data['navigation.headingTrue'] || 0;
    const rotationAngle = -(cogRad * 57.2958);
    const cogDigital = typeof cogRad === 'number' ? (cogRad * 57.2958).toFixed(1) : '---';
    const cogSquare = typeof cogRad === 'number' ? (cogRad * 57.2958).toFixed(0) + '°' : '---';

    const twdDeg = radToDeg(data['environment.wind.directionTrue'] || 0);
    const twdDigital = !isNaN(twdDeg) ? Math.abs(normalizeAngle(twdDeg)).toFixed(0) + '°' : '---';

    const twaCogDegrees = !isNaN(twdDeg) && typeof cogRad === 'number'
        ? normalizeAngle(twdDeg - radToDeg(cogRad))
        : null;

    // Alarma y Estados
    const isDepthAlarmActive = depthMeters < depthThreshold && depthMeters > 0;
    const absTWA = Math.abs(twaCogDegrees || 0);
    const isTwaInTarget = absTWA >= ajustesConsola.minAnguloCeñida && absTWA <= ajustesConsola.maxAnguloCeñida;

    
    // --- COLORES DINÁMICOS ---
    const theme = {
        heading: '#dc1212ff',
        wind: isNightMode ? '#900' : '#ff9800',
        twd: isNightMode ? '#004' : '#2196f3',
        bg: isNightMode ? 'rgba(30, 0, 0, 0.8)' : 'rgba(45, 45, 45, 0.75)',
        alarm: 'rgba(210, 0, 0, 0.95)',
        statusDot: isTwaInTarget ? '#00FF00' : '#FF0000'
    };

    // --- EFECTOS (MÁXIMOS) ---
    useEffect(() => {
        const s = parseFloat(sogKnots);
        if (s > maxSOG) setMaxSOG(s);
    }, [sogKnots]);

    useEffect(() => {
        const t = parseFloat(twsKnots);
        if (t > maxTWS) setMaxTWS(t);
    }, [twsKnots]);

    useEffect(() => {
        const cargarAjustes = async () => {
            const guardados = await AsyncStorage.getItem('@ajustes_consola');
            if (guardados) {
                setAjustesConsola(JSON.parse(guardados));
            } else {
                // Valores por defecto si no hay nada guardado
                setAjustesConsola({ minAnguloCeñida: 20, maxAnguloCeñida: 60 });
            }
        };
        cargarAjustes();
    }, []);

const guardarAjustePersistente = async (clave, valor) => {
    const nuevos = { ...ajustesConsola, [clave]: Math.round(valor) };
    await AsyncStorage.setItem('@ajustes_consola', JSON.stringify(nuevos));
    console.log(`Guardado en memoria: ${clave} = ${valor}`);
};

    // --- MANEJADORES ---
    const validarYGuardar = async (clave, valor) => {
        let num = parseInt(valor) || 0;
        let nuevos = { ...ajustesConsola };
        if (clave === 'minAnguloCeñida') {
            num = Math.max(10, Math.min(90, num));
            nuevos.minAnguloCeñida = num;
            if (nuevos.maxAnguloCeñida <= num) nuevos.maxAnguloCeñida = num + 5;
        } else {
            nuevos.maxAnguloCeñida = Math.max(nuevos.minAnguloCeñida + 5, num);
        }
        setAjustesConsola(nuevos);
        await AsyncStorage.setItem('@ajustes_consola', JSON.stringify(nuevos));
    };

    // --- RENDERIZADO DE PANTALLA PRINCIPAL ---
    const renderMainConsole = () => (
        <View style={[styles.screen, { width: windowWidth, backgroundColor: isNightMode ? '#050000' : '#0a0a0a' }]}>
            <View style={[styles.consoleFrame, isNightMode && styles.consoleFrameNight]}>
                <ImageBackground
                    source={require('./assets/images/CarbonFiber.png')}
                    style={{ flex: 1, width: '100%' }} // 👈 flex: 1 es clave aquí
                    resizeMode="repeat"
                    imageStyle={{ borderRadius: 25, opacity: isNightMode ? 0.3 : 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.dataGrid}>
                            {/* Header Status */}
                            <View style={styles.headerRow}>
                                <Text style={[styles.statusText, { color: isNightMode ? '#400' : '#666' }]}>
                                    {data.isConnected ? '🟢 CONNECTED' : '🔴 NOT CONNECTED'}
                                </Text>
                                <TouchableOpacity onPress={() => setModalVisible(true)}>
                                    <MaterialIcons name="settings" size={40} color={isNightMode ? "#600" : "#aaa"} />
                                </TouchableOpacity>
                            </View>

                            {/* Compás Principal */}
                            <HeadingGauge
                                size={gaugeSize}
                                headingColor={theme.heading}
                                rotationAngle={rotationAngle} // El giro del dia
                                value={cogDigital}
                                unit="°COG"
                                twd={twdDeg}
                                twaCog={twaCogDegrees}
                                isNightMode={isNightMode}
                                minLayline={ajustesConsola.minAnguloCeñida}
                                maxLayline={ajustesConsola.maxAnguloCeñida}
                                set={data['ocean.set']}
                            />

                            {/* Info Paneles (Máximos) */}
                            <View style={[styles.row, { marginBottom: 0 }]}>
                                <InfoPanel
                                    dataArray={[{ label: 'MAX TWS', value: maxTWS, color: '#79f17bff' }]}
                                    color={theme.bg} width={columnWidth} />
                                <InfoPanel
                                    dataArray={[{ label: 'MAX SOG', value: maxSOG, color: '#79f17bff' }]} color={theme.bg}
                                    width={columnWidth} />
                                <View style={{ width: columnWidth }} />

                            </View>

                            {/* Fila 1: Viento y Velocidad */}
                            <View style={styles.row}>
                                <DataSquare label="TWS" value={twsKnots} unit="KTS" 
                                showHistory showProgressBar maxValue={maxTWS} 
                                color={theme.bg} onPress={() => setMaxTWS(0)} />
                                <DataSquare label="SOG" value={sogKnots} unit="KTS" showHistory showProgressBar maxValue={maxSOG} color={theme.bg} onPress={() => setMaxSOG(0)} />
                                <DataSquare label="TWA" 
                                value={twaCogDegrees?.toFixed(0) + '°'} unit="DEG" 
                                textColor={theme.wind} showStatusDot 
                                statusDotColor={theme.statusDot} color={theme.bg} />
                            </View>

                            {/* Fila 2: Rumbo y Profundidad */}
                            <View style={styles.row}>
                                <DataSquare label="COG" value={cogSquare} unit="TRUE" textColor={theme.heading} color={theme.bg} />
                                <DataSquare
                                    label="DEPTH" value={depthMeters.toFixed(1)} unit="MTRS"
                                    color={isDepthAlarmActive ? theme.alarm : theme.bg}
                                    showStatusDot={isDepthAlarmActive} statusDotColor="#fff" textColor={isDepthAlarmActive ? "#fff" : undefined}
                                />
                                <DataSquare label="TWD" value={twdDigital} unit="TRUE" textColor={theme.twd} color={theme.bg} />
                            </View>
                            <View style={styles.row}>

                            </View>
                        </View>
                    </ScrollView>
                </ImageBackground>
            </View>
        </View>
    );

    const actualizarAjuste = async (clave, valor) => {
    const nuevos = { ...ajustesConsola, [clave]: Math.round(valor) };
    setAjustesConsola(nuevos);
    await AsyncStorage.setItem('@ajustes_consola', JSON.stringify(nuevos));
};
    return (
        <View style={styles.mainContainer}>
            <ScrollView
                horizontal
                pagingEnabled
                contentContainerStyle={{ width: windowWidth * 2 }}
            >
                {renderMainConsole()}

                {/* Segunda Pantalla (Detalles) */}
                <View style={[styles.screen, { width: windowWidth, height: windowHeight, backgroundColor: '#111', justifyContent: 'center' }]}>
                    <Text style={{ color: '#444', fontSize: 20 }}>PANTALLA DE TELEMETRÍA</Text>
                </View>
            </ScrollView>

<Modal animationType="fade" transparent visible={isModalVisible}>
    <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>AJUSTES DE CONSOLA</Text>

            {/* Slider Mínimo (20°) */}
            <View style={styles.settingRowContainer}>
                <View style={styles.labelRow}>
                    <Text style={styles.settingLabel}>Mínimo Ceñida</Text>
                    {/* Este texto se actualizará en tiempo real gracias a setAjustesConsola */}
                    <Text style={[styles.valueLabel, { color: '#00ff00' }]}>
                        {ajustesConsola.minAnguloCeñida}°
                    </Text>
                </View>
                <Slider
                    style={styles.slider}
                    minimumValue={10}
                    maximumValue={45}
                    step={1}
                    value={ajustesConsola.minAnguloCeñida}
                    // Actualiza el estado VISUAL mientras mueves
                    onValueChange={(v) => setAjustesConsola({ ...ajustesConsola, minAnguloCeñida: Math.round(v) })}
                    // GUARDA en memoria solo cuando sueltas
                    onSlidingComplete={(v) => guardarAjustePersistente('minAnguloCeñida', v)}
                    minimumTrackTintColor="#00ff00"
                    maximumTrackTintColor="#333"
                    thumbTintColor="#00ff00"
                />
            </View>

            {/* Slider Máximo (60°) */}
            <View style={styles.settingRowContainer}>
                <View style={styles.labelRow}>
                    <Text style={styles.settingLabel}>Máximo Ceñida</Text>
                    <Text style={[styles.valueLabel, { color: '#ff0000' }]}>
                        {ajustesConsola.maxAnguloCeñida}°
                    </Text>
                </View>
                <Slider
                    style={styles.slider}
                    minimumValue={50}
                    maximumValue={90}
                    step={1}
                    value={ajustesConsola.maxAnguloCeñida}
                    // Actualiza el estado VISUAL mientras mueves
                    onValueChange={(v) => setAjustesConsola({ ...ajustesConsola, maxAnguloCeñida: Math.round(v) })}
                    // GUARDA en memoria solo cuando sueltas
                    onSlidingComplete={(v) => guardarAjustePersistente('maxAnguloCeñida', v)}
                    minimumTrackTintColor="#ff0000"
                    maximumTrackTintColor="#333"
                    thumbTintColor="#ff0000"
                />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Modo Noche</Text>
                <Switch 
                    value={isNightMode} 
                    onValueChange={setIsNightMode}
                    trackColor={{ false: "#333", true: "#dc1212" }}
                />
            </View>

            <TouchableOpacity 
                onPress={() => setModalVisible(false)} 
                style={styles.closeBtn}
            >
                <Text style={styles.closeBtnText}>CERRAR</Text>
            </TouchableOpacity>
        </View>
    </View>
</Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#000' },
    screen: { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 50 : 20 },
    fullSize: { width: '100%', height: '100%' },
    scrollContent: { alignItems: 'center', paddingBottom: 45 },
    consoleFrame: {
        alignSelf: 'center',
        width: '96%',
        height: '98%',
        borderRadius: 28,
        backgroundColor: '#111',
        borderWidth: 2,
        borderColor: '#333',
        overflow: 'hidden',
    },
    consoleFrameNight: { borderColor: '#400' },
    dataGrid: { width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.4)', paddingVertical: 10, alignItems: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '92%', alignSelf: 'center', marginBottom: 15 },
    statusText: { fontSize: 12, fontWeight: 'bold', fontFamily: 'NauticalFont' },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        width: '100%',
        marginBottom: 8, // Espacio entre filas
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '85%', backgroundColor: '#1a1a1a', borderRadius: 20, padding: 25 },
    modalTitle: { color: '#fff', fontSize: 22, textAlign: 'center', marginBottom: 20 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    settingLabel: { color: '#ccc' },
    closeBtn: { backgroundColor: '#dc1212', padding: 15, borderRadius: 12, alignItems: 'center' },
    closeBtnText: { color: '#fff', fontWeight: 'bold' },
});

export default SignalKConnector;