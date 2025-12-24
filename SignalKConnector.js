import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { useEffect, useMemo, useState } from 'react';
import {
    ImageBackground, Modal, Platform, ScrollView, StyleSheet,
    Switch, Text, TouchableOpacity, useWindowDimensions, View
} from 'react-native';

// Utils y Hooks
import { useSignalKData } from './useSignalKData';
import { mpsToKnots, normalizeAngle, radToDeg } from './utils/Utils';

// Componentes
import DataSquare from './components/gauges/DataSquare';
import HeadingGauge from './components/gauges/HeadingGauge';
import InfoPanel from './components/gauges/InfoPanel';
import SogGauge from './components/gauges/SOGGauge.js';
import NavigationMode from './components/NavigationMode';

const SignalKConnector = () => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const data = useSignalKData();

    // --- ESTADOS ---
    const [isModalVisible, setModalVisible] = useState(false);
    const [isNightMode, setIsNightMode] = useState(false);
    const [maxSOG, setMaxSOG] = useState(0);
    const [maxTWS, setMaxTWS] = useState(0);
    const [ajustesConsola, setAjustesConsola] = useState({
        minAnguloCeñida: 20,
        maxAnguloCeñida: 60,
    });

    // --- CÁLCULOS OPTIMIZADOS (useMemo) ---
    const processed = useMemo(() => {
        // 1. Corriente (Set & Drift)
        const rawDrift = data['navigation.current.drift'] ?? data['performance.currentDrift'] ?? data['ocean.drift'] ?? 0;
        const rawSet = data['navigation.current.setTrue'] ?? data['performance.currentSetTrue'] ?? data['ocean.set'] ?? 0;

        // 2. Navegación (COG)
        const headingRad = data['navigation.headingTrue'] ?? 0;
        const headingDeg = radToDeg(headingRad);

        // 3. Viento (TWS & TWD)
        const twsMps = data['environment.wind.speedTrue'] ?? 0;
        const twdRad = data['environment.wind.directionTrue'] ?? 0;
        const twdDeg = radToDeg(twdRad);
        // 4. Profundidad
        const depth = data['navigation.depthBelowTransducer'] ?? 0;
        // 5. Datos del motor para modo de navegación
        const engineRpm = data['propulsion.0.revolutions'] ?? 0;

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
            navigationMode: (engineRpm > 0) ? 'ENGINE' : 'SAIL',
            depthMeters: depth
        };
    }, [data]);

    // --- LÓGICA DE INTERFAZ ---
    const columnWidth = (windowWidth * 0.94) / 3;
    const gaugeSize = Math.min(windowWidth * 0.90, windowHeight * 0.45);
    const rotationAngle = -processed.cogDeg;
    const isDepthAlarmActive = processed.depthMeters < 3.0 && processed.depthMeters > 0;
    const absTWA = Math.abs(processed.twaCog || 0);
    const isTwaInTarget = absTWA >= ajustesConsola.minAnguloCeñida && absTWA <= ajustesConsola.maxAnguloCeñida;

    const theme = {
        heading: '#dc1212ff',
        wind: isNightMode ? '#900' : '#ff9800',
        twd: isNightMode ? '#004' : '#2196f3',
        bg: isNightMode ? 'rgba(30, 0, 0, 0.8)' : 'rgba(45, 45, 45, 0.75)',
        alarm: 'rgba(210, 0, 0, 0.95)',
        statusDot: isTwaInTarget ? '#00FF00' : '#FF0000'
    };

    // --- EFECTOS (Persistencia y Máximos) ---
    useEffect(() => {
        if (parseFloat(processed.sogKnots) > maxSOG) setMaxSOG(parseFloat(processed.sogKnots));
        if (parseFloat(processed.twsKnots) > maxTWS) setMaxTWS(parseFloat(processed.twsKnots));
    }, [processed.sogKnots, processed.twsKnots]);

    useEffect(() => {
        const cargarAjustes = async () => {
            const guardados = await AsyncStorage.getItem('@ajustes_consola');
            if (guardados) setAjustesConsola(JSON.parse(guardados));
        };
        cargarAjustes();
    }, []);

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
                                <View style={{ width: columnWidth }} />
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
                                <DataSquare label="TWD" value={processed.twdDigital} unit="TRUE" textColor={theme.twd} color={theme.bg} />
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

                        <View style={[styles.row, { marginBottom: 20 }]}>
                            <SogGauge
                                size={gaugeSize}
                                value={parseFloat(processed.sogKnots)}
                                // Usamos el maxSOG que ya calculas y guardas en el useEffect
                                maxSpeed={maxSOG > 5 ? Math.ceil(maxSOG) : 10}
                                isNightMode={isNightMode}
                                headingColor={theme.heading}
                            />
                        </View>
                        <View style={[styles.row, { marginBottom: 20 }]}>
                            <NavigationMode
                                width={gaugeSize.width}
                                height={gaugeSize.height ? gaugeSize.height * 0.1 : 100}
                                isSail={processed.navigationMode === 'SAIL'}
                                isNightMode={isNightMode}
                            >
                            </NavigationMode>
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
                            { label: 'Máximo Ceñida', key: 'maxAnguloCeñida', min: 50, max: 90, color: '#ff0000' }
                        ].map(s => (
                            <View key={s.key} style={styles.settingRowContainer}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.settingLabel}>{s.label}</Text>
                                    <Text style={[styles.valueLabel, { color: s.color }]}>{ajustesConsola[s.key]}°</Text>
                                </View>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={s.min} maximumValue={s.max} step={1}
                                    value={ajustesConsola[s.key]}
                                    onValueChange={(v) => setAjustesConsola({ ...ajustesConsola, [s.key]: Math.round(v) })}
                                    onSlidingComplete={(v) => guardarAjustePersistente(s.key, v)}
                                    minimumTrackTintColor={s.color} thumbTintColor={s.color}
                                />
                            </View>
                        ))}

                        <View style={styles.divider} />
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Modo Noche</Text>
                            <Switch value={isNightMode} onValueChange={setIsNightMode} trackColor={{ false: "#333", true: "#dc1212" }} />
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

// ... Estilos (se mantienen igual pero añadí unos necesarios para los sliders nuevos)
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

export default SignalKConnector;