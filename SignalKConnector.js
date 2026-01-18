
// --- LIBRERÍAS Y COMPONENTES ---
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { useEffect, useMemo, useState } from 'react';
import {
    ImageBackground, Modal, Platform, ScrollView, StyleSheet,
    Switch, Text, TouchableOpacity, useWindowDimensions, View
} from 'react-native';
import ControlPanelBase from './components/ControlPanelBase';
import DataSquare from './components/DataSquare.js';
import HeadingGauge from './components/gauges/HeadingGauge';
import InfoPanel from './components/gauges/InfoPanel';
import SogGauge from './components/gauges/SOGGauge.js';
import NavigationMode from './components/NavigationMode';
import SailDataOverlay from './components/SailDataOverlay.js';
import { useSignalKData } from './useSignalKData';
import { mpsToKnots, normalizeAngle, radToDeg } from './utils/Utils';


/**
 * SignalKConnector: Consola principal de navegación y telemetría
 */
const SignalKConnector = () => {
    // --- Dimensiones de ventana y datos ---
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const data = useSignalKData();

    // --- Estados de UI y configuración ---
    const [isModalVisible, setModalVisible] = useState(false);
    const [isNightMode, setIsNightMode] = useState(false);
    const [maxSOG, setMaxSOG] = useState(0);
    const [maxTWS, setMaxTWS] = useState(0);
    const [ajustesConsola, setAjustesConsola] = useState({
        minAnguloCeñida: 20,
        maxAnguloCeñida: 60,
        rudderLimit: 35,
    });

    // --- Cálculos optimizados (useMemo) ---
    const processed = useMemo(() => {

        // Corriente (Set & Drift)
        const rawDrift = data['navigation.current.drift'] ?? data['performance.currentDrift'] ?? data['ocean.drift'] ?? 0;
        const rawSet = data['navigation.current.setTrue'] ?? data['performance.currentSetTrue'] ?? data['ocean.set'] ?? 0;
        const rawRudderAngle = data['steering.rudderAngle'] ?? 0;
        // Navegación (COG)
        const headingRad = data['navigation.headingTrue'] ?? 0;
        const headingDeg = radToDeg(headingRad);
        // Viento (TWS & TWD)
        const twsMps = data['environment.wind.speedTrue'] ?? 0;
        const twdRad = data['environment.wind.directionTrue'] ?? 0;
        const twdDeg = radToDeg(twdRad);
        const depth = data['navigation.depthBelowTransducer'] ?? 0;
        const engineRpm = data['propulsion.0.revolutions'] ?? 0;
        const awaRad = data['environment.wind.angleApparent'] ?? 0;
        const awaDeg = radToDeg(awaRad);
        const awaFixed = Math.abs(normalizeAngle(awaDeg)).toFixed(0);
        const awaSide = normalizeAngle(awaDeg) < 0 ? 'P' : 'S';
        const apState = data['steering.autopilot.state'];
        const vesselHeelRad = data['vessels.self.navigation.attitude.roll'] ?? 0;
        return {
            driftKnots: rawDrift * 1.94384,
            setDeg: radToDeg(rawSet),
            cogDeg: headingDeg, // Para compatibilidad con componentes existentes
            cogDigital: headingDeg.toFixed(1),
            cogSquare: headingDeg.toFixed(0) + '°',
            twsKnots: mpsToKnots(twsMps),
            twdDeg: twdDeg,
            twdDigital: !isNaN(twdDeg) ? Math.abs(normalizeAngle(twdDeg)).toFixed(0) + '°' : '---',
            twaCog: !isNaN(twdDeg) ? normalizeAngle(headingDeg - twdDeg) : null, // TWA respecto a proa (signed, COG)
            twa: !isNaN(twdDeg) ? -normalizeAngle(headingDeg - twdDeg) : null, // TWA con signo (positivo = estribor, negativo = babor)
            sogKnots: mpsToKnots(data['navigation.speedOverGround'] ?? 0),
            depthMeters: depth,
            rudderAngle: Math.round(rawRudderAngle * (180 / Math.PI)),
            engineRpm: engineRpm * 60,
            navigationMode: ((engineRpm * 60) > 666661 ? 'ENGINE' : 'SAIL'),
            awa: normalizeAngle(awaDeg),
            awaFixed: awaFixed,
            awaDigital: 'AWA (' + awaSide + ')',
            apState: apState,
            vesselHeelDeg: radToDeg(vesselHeelRad)
        };
    }, [data]);


    const apInfo = useMemo(() => {
        const state = processed.apState; // Viene de Signal K
        switch (state) {
            case 'auto':
                return { label: 'PILOT', value: 'AUTO', color: '#79f17bff' }; // Verde ceñida
            case 'wind':
                return { label: 'PILOT', value: 'WIND', color: '#2196f3' };   // Azul viento
            case 'route':
                return { label: 'PILOT', value: 'TRACK', color: '#bb86fc' };  // Púrpura navegación
            default:
                return { label: 'PILOT', value: 'STBY', color: '#ff4444' };   // Rojo standby
        }
    }, [processed.apState]);


    // --- Lógica de interfaz y tema visual ---
    const columnWidth = (windowWidth * 0.94) / 3;
    const gaugeSize = Math.min(windowWidth * 0.90, windowHeight * 0.45);
    const rotationAngle = -processed.cogDeg;
    const isDepthAlarmActive = processed.depthMeters < 3.0 && processed.depthMeters > 0;
    const absTWA = Math.abs(processed.twaCog || 0);
    const isTwaInTarget = absTWA >= ajustesConsola.minAnguloCeñida && absTWA <= ajustesConsola.maxAnguloCeñida;
    const apMode = processed.apState !== 'standby' ? processed.apState.toUpperCase() : 'MANUAL';
    const apColor = processed.apState !== 'standby' ? '#79f17bff' : '#ff4444ff'; // Verde si está activo, Rojo si es manual
    // Paleta de colores y tema
    const theme = {
        heading: '#dc1212ff',
        wind: isNightMode ? '#900' : '#ff9800',
        twd: isNightMode ? '#004' : '#2196f3',
        bg: isNightMode ? 'rgba(30, 0, 0, 0.8)' : 'rgba(45, 45, 45, 0.75)',
        alarm: 'rgba(210, 0, 0, 0.95)',
        statusDot: isTwaInTarget ? '#00FF00' : '#FF0000'
    };


    // --- Efectos: persistencia y máximos ---
    // Actualiza máximos de SOG y TWS
    useEffect(() => {
        if (parseFloat(processed.sogKnots) > maxSOG) setMaxSOG(parseFloat(processed.sogKnots));
        if (parseFloat(processed.twsKnots) > maxTWS) setMaxTWS(parseFloat(processed.twsKnots));
    }, [processed.sogKnots, processed.twsKnots]);

    // Carga los ajustes persistentes al montar el componente
    useEffect(() => {
        const cargarAjustes = async () => {
            const guardados = await AsyncStorage.getItem('@ajustes_consola');
            if (guardados) setAjustesConsola(JSON.parse(guardados));
        };
        cargarAjustes();
    }, []);

    /**
     * Guarda un ajuste de consola de forma persistente en AsyncStorage
     */
    const guardarAjustePersistente = async (clave, valor) => {
        const nuevos = { ...ajustesConsola, [clave]: Math.round(valor) };
        setAjustesConsola(nuevos);
        await AsyncStorage.setItem('@ajustes_consola', JSON.stringify(nuevos));
    };

    const renderMainConsole = () => (
        <View style={[styles.screen, { width: windowWidth, backgroundColor: isNightMode ? '#050000' : '#0a0a0a' }]}>
            <View style={[styles.consoleFrame, isNightMode && styles.consoleFrameNight]}>
                <ImageBackground
                    source={require('./assets/images/CarbonFiber.png')}
                    style={{ flex: 1, width: '100%' }}
                    resizeMode="repeat"
                    imageStyle={{ borderRadius: 25, opacity: isNightMode ? 0.3 : 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.dataGrid}>
                            <View style={styles.headerRow}>
                                <Text style={[styles.statusText, { color: isNightMode ? '#400' : '#666' }]}>
                                    {data.isConnected ? '🟢 CONNECTED' : '🔴 NOT CONNECTED'}
                                </Text>
                                <TouchableOpacity onPress={() => setModalVisible(true)}>
                                    <MaterialIcons name="settings" size={40} color={isNightMode ? "#600" : "#aaa"} />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.row, { marginBottom: 25 }]}>
                                <HeadingGauge
                                    size={gaugeSize}
                                    headingColor={theme.heading}
                                    rotationAngle={rotationAngle}
                                    value={processed.cogDigital}
                                    awa={processed.awa}
                                    unit="°COG"
                                    twd={processed.twdDeg}
                                    twaCog={processed.twaCog}
                                    isNightMode={isNightMode}
                                    minLayline={ajustesConsola.minAnguloCeñida}
                                    maxLayline={ajustesConsola.maxAnguloCeñida}
                                    set={processed.setDeg}
                                    drift={processed.driftKnots}
                                />
                            </View>
                            <View style={[styles.row, { marginBottom: 7 }]}>
                                <InfoPanel dataArray={[{ label: 'MAX TWS', value: maxTWS, color: '#79f17bff' }]} color={theme.bg} width={columnWidth} />
                                <InfoPanel dataArray={[{ label: 'MAX SOG', value: maxSOG, color: '#79f17bff' }]} color={theme.bg} width={columnWidth} />
                                <InfoPanel dataArray={[{ label: apInfo.label, value: apInfo.value, color: apInfo.color }]} color={theme.bg} width={columnWidth} />
                            </View>
                            <View style={styles.row}>
                                <DataSquare label="TWS" value={processed.twsKnots} unit="KTS" showHistory showProgressBar maxValue={maxTWS} color={theme.bg} onPress={() => setMaxTWS(0)} />
                                <DataSquare
                                    label="SOG"
                                    value={processed.sogKnots} unit="KTS"
                                    showHistory showProgressBar
                                    maxValue={maxSOG} color={theme.bg}
                                    onPress={() => setMaxSOG(0)} />
                                <DataSquare
                                    label={processed.twa > 0 ? "TWA (P)" : processed.twa < 0 ? "TWA (S)" : "TWA"}
                                    value={processed.twa?.toFixed(0) + '°'}
                                    unit="DEG"
                                    textColor={theme.wind}
                                    showStatusDot
                                    statusDotColor={theme.statusDot}
                                    color={theme.bg}
                                />
                            </View>

                            <View style={styles.row}>
                                <DataSquare label="COG" value={processed.cogSquare} unit="TRUE" textColor={theme.heading} color={theme.bg} />
                                <DataSquare label="DEPTH"
                                    value={processed.depthMeters.toFixed(1)}
                                    unit="MTRS"
                                    color={isDepthAlarmActive ? theme.alarm : theme.bg}
                                    textColor={isDepthAlarmActive ? "#fff" : undefined} />

                                <DataSquare
                                    label={processed.awaDigital}
                                    value={processed.awaFixed}
                                    unit="DEG"
                                    textColor={theme.twd}
                                    color={theme.bg} />

                            </View>
                        </View>
                    </ScrollView>
                </ImageBackground>
            </View>
        </View>
    );

    const renderTelemetryDetails = () => (
        <View style={[styles.screen, { width: windowWidth, backgroundColor: isNightMode ? '#050000' : '#0a0a0a' }]}>
            <View style={[styles.consoleFrame, isNightMode && styles.consoleFrameNight]}>
                <ImageBackground
                    source={require('./assets/images/CarbonFiber.png')}
                    style={{ flex: 1, width: '100%' }}
                    resizeMode="repeat"
                    imageStyle={{ borderRadius: 25, opacity: isNightMode ? 0.3 : 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.dataGrid}>
                            <View style={styles.headerRow}>
                                <Text style={[styles.statusText, { color: isNightMode ? '#400' : '#666' }]}>
                                    {data.isConnected ? '🟢 CONNECTED' : '🔴 NOT CONNECTED  '}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.row, { marginBottom: windowHeight * 0.025 }]}>
                            <SogGauge
                                size={gaugeSize}
                                value={parseFloat(processed.sogKnots)}
                                isSail={processed.navigationMode === 'SAIL'}
                                maxSpeed={maxSOG > 5 ? Math.ceil(maxSOG) : 10}
                                isNightMode={isNightMode}
                                headingColor={theme.heading}
                            />
                        </View>
                        <View style={[styles.row, { marginBottom: windowHeight * 0.025 }]}>
                            <NavigationMode
                                width={gaugeSize.width}
                                height={gaugeSize.height ? gaugeSize.height * 0.1 : 100}
                                isSail={processed.navigationMode === 'SAIL'}
                                isNightMode={isNightMode}

                            >
                            </NavigationMode>
                        </View>
                        <View style={styles.row} >
                            <ControlPanelBase>
                                {processed.navigationMode === 'SAIL' ? (
                                    <>
                                        <SailDataOverlay
                                            rudderAngle={processed.rudderAngle}
                                            rudderLimit={ajustesConsola.rudderLimit}
                                            heading={processed.cogDeg}
                                            vmg={Math.abs(processed.sogKnots * Math.cos((processed.twaCog * Math.PI) / 180))}
                                            targetVMG={maxSOG * Math.cos((ajustesConsola.minAnguloCeñida * Math.PI) / 180)}
                                            vesselHeelDeg={processed.vesselHeelDeg}
                                            size={125}
                                        />
                                    </>
                                ) : (
                                    <SailDataOverlay
                                        rudderAngle={processed.rudderAngle}
                                        rudderLimit={ajustesConsola.rudderLimit}
                                        heading={processed.cogDeg}
                                    />
                                )}
                            </ControlPanelBase>
                        </View>
                        <View style={styles.row}>
                            <View style={{ marginTop: 40 }}>
                                <DataSquare
                                    label="VMC"
                                    value={(processed.sogKnots * Math.cos((processed.twaCog * Math.PI) / 180)).toFixed(1)}
                                    unit="KTS"
                                    color={theme.bg}
                                />
                            </View>
                        </View>

                    </ScrollView>
                </ImageBackground>
            </View>
        </View>
    );
    return (
        <View style={styles.mainContainer}>
            <ScrollView horizontal pagingEnabled contentContainerStyle={{ width: windowWidth * 2 }}>
                {renderMainConsole()}
                {renderTelemetryDetails()}
            </ScrollView>
            <Modal animationType="fade" transparent visible={isModalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>AJUSTES DE CONSOLA</Text>

                        {/* Render de Sliders simplificado */}
                        {[
                            { label: 'Mínimo Ceñida', key: 'minAnguloCeñida', min: 10, max: 45, color: '#00ff00' },
                            { label: 'Máximo Ceñida', key: 'maxAnguloCeñida', min: 50, max: 90, color: '#ff0000' },
                            // NUEVO: Ajuste para el límite de alerta del timón
                            { label: 'Alerta de Timón', key: 'rudderLimit', min: 20, max: 45, color: '#00ffff' }
                        ].map(s => (
                            <View key={s.key} style={styles.settingRowContainer}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.settingLabel}>{s.label}</Text>
                                    <Text style={[styles.valueLabel, { color: s.color }]}>
                                        {ajustesConsola[s.key] || (s.key === 'rudderLimit' ? 35 : 0)}°
                                    </Text>
                                </View>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={s.min}
                                    maximumValue={s.max}
                                    step={1}
                                    value={ajustesConsola[s.key] || (s.key === 'rudderLimit' ? 35 : 0)}
                                    onValueChange={(v) => setAjustesConsola({ ...ajustesConsola, [s.key]: Math.round(v) })}
                                    onSlidingComplete={(v) => guardarAjustePersistente(s.key, v)}
                                    minimumTrackTintColor={s.color}
                                    thumbTintColor={s.color}
                                    maximumTrackTintColor="rgba(255,255,255,0.1)"
                                />
                            </View>
                        ))}

                        <View style={styles.divider} />

                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Modo Noche</Text>
                            <Switch
                                value={isNightMode}
                                onValueChange={setIsNightMode}
                                trackColor={{ false: "#333", true: "#dc1212" }}
                            />
                        </View>

                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>CERRAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};


// --- Estilos globales del componente ---
const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#000' },
    screen: { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 50 : 20 },
    scrollContent: { alignItems: 'center', paddingBottom: 45 },
    consoleFrame: { alignSelf: 'center', width: '96%', height: '98%', borderRadius: 28, backgroundColor: '#111', borderWidth: 2, borderColor: '#333', overflow: 'hidden' },
    consoleFrameNight: { borderColor: '#400' },
    dataGrid: { width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.4)', paddingVertical: 10, alignItems: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '92%', alignSelf: 'center', marginBottom: 15 },
    statusText: { fontSize: 12, fontWeight: 'bold', fontFamily: 'NauticalFont' },
    row: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', marginBottom: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '85%', backgroundColor: '#1a1a1a', borderRadius: 20, padding: 25 },
    modalTitle: { color: '#fff', fontSize: 22, textAlign: 'center', marginBottom: 20 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
    settingRowContainer: { marginBottom: 20 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    settingLabel: { color: '#ccc' },
    valueLabel: { fontWeight: 'bold' },
    slider: { width: '100%', height: 40 },
    divider: { height: 1, backgroundColor: '#333', marginVertical: 15 },
    closeBtn: { backgroundColor: '#dc1212', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    closeBtnText: { color: '#fff', fontWeight: 'bold' },
});

// Export principal del componente
export default SignalKConnector;