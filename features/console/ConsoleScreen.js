import UpdateNotice from '../../components/UpdateNotice';
import { useVisibleAisCount } from './hooks/useVisibleAisCount';
import { useAisAutoRange } from './hooks/useAisAutoRange';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useSignalKData } from '../../services/signalk/useSignalKData';
import { useWaypointData } from '../../services/signalk/useWaypointData';
import { useAisData } from '../../services/signalk/useAisData';
import ConsoleSettingsModal from './components/ConsoleSettingsModal';
import { useConsoleSettings } from './hooks/useConsoleSettings';
import { AnchorWatchContext, useAnchorWatch } from './hooks/useAnchorWatch';
import { useAnchorAlarmSound } from './hooks/useAnchorAlarmSound';
import { useDepthAlarmSound } from './hooks/useDepthAlarmSound';
import { useSessionMaxima } from './hooks/useSessionMaxima';
import { useInstrumentHistory } from './hooks/useInstrumentHistory';
import { deriveNavigationData } from './model/navigationData';
import NavigationPage from './screens/NavigationPage';
import LandscapeNavigationPage from './screens/LandscapeNavigationPage';
// import TelemetryPage from './screens/TelemetryPage';
import { styles } from './styles/consoleStyles';
import { getConsoleTheme } from './styles/consoleTheme';
import NightDimmer, { NightModeContext } from '../../components/NightDimmer';
import { LanguageProvider } from '../../localization/LanguageProvider';
import StartupLauncher from '../../components/StartupLauncher';
import { useAisCollisionRisk } from './hooks/useAisCollisionRisk';
import AisCollisionNotice from './components/AisCollisionNotice';
import { useAisCollisionAlarm } from './hooks/useAisCollisionAlarm';
import { useEngineConsumption } from './hooks/useEngineConsumption';
import { EngineConsumptionTotalContext, useEngineConsumptionTotal } from './hooks/useEngineConsumptionTotal';
import { EngineHoursContext, useEngineHours } from './hooks/useEngineHours';
/** Coordina datos y acciones. Cada página se ocupa de su presentación. */
export default function ConsoleScreen() {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const { settings, isLoaded, updateSetting, saveSetting } = useConsoleSettings();
    const [starting, setStarting] = useState(true);
    const finishStartup = useCallback(() => setStarting(false), []);
    const [aisVisible, setAisVisible] = useState(false);
    const ais = useAisData(settings.signalKAddress, isLoaded);
    const { history: twsHistory, clearHistory: clearTwsHistory, recordReading } = useInstrumentHistory(
        'tws', settings.signalKAddress, isLoaded, settings.historyHours,
    );
    const { history: sogHistory, clearHistory: clearSogHistory, recordReading: recordSogReading } = useInstrumentHistory(
        'sog', settings.signalKAddress, isLoaded, settings.sogHistoryHours,
    );
    const data = useSignalKData(settings.signalKAddress, isLoaded, recordReading, recordSogReading);
    const rawNavigation = useMemo(() => deriveNavigationData(data), [data]);
    const engineConsumption = useEngineConsumption(rawNavigation.engineRpm, settings.engineConsumptionTable, data.isConnected);
    const engineConsumptionTotal = useEngineConsumptionTotal({ rate: engineConsumption,
        rpm: rawNavigation.engineRpm, receivedAt: rawNavigation.engineRpmReceivedAt,
        connected: data.isConnected, source: settings.signalKAddress }, isLoaded);
    const engineHours = useEngineHours({ rpm: rawNavigation.engineRpm,
        receivedAt: rawNavigation.engineRpmReceivedAt, connected: data.isConnected,
        source: settings.signalKAddress,
        authoritativeHours: Number.isFinite(rawNavigation.engineRunTimeSeconds)
            ? rawNavigation.engineRunTimeSeconds / 3600 : null,
        authoritativeReceivedAt: rawNavigation.engineRunTimeReceivedAt }, isLoaded);
    const navigation = useMemo(() => ({ ...rawNavigation, engineConsumptionLitresPerHour: engineConsumption }), [rawNavigation, engineConsumption]);
    const evaluatedAisTargets = useAisCollisionRisk(ais.targets, data, settings, data.isConnected && ais.status === 'connected');
    const aisAlertTargets = aisVisible ? evaluatedAisTargets : {};
    const aisAlarm = useAisCollisionAlarm(aisAlertTargets, aisVisible && settings.aisCollisionEnabled !== false);
    const anchorWatch = useAnchorWatch(navigation.position, navigation.positionReceivedAt, data.isConnected);
    useAnchorAlarmSound(anchorWatch.status === 'outside' || anchorWatch.status === 'gpsLost');
    const [aisAuto, setAisAuto] = useState(false);
    const aisRangeNm = useAisAutoRange(aisAuto, settings.aisRangeNm, {
        targets: ais.targets, position: navigation.position, positionReceivedAt: navigation.positionReceivedAt,
        connected: data.isConnected && ais.status === 'connected',
    });
    const aisVisibleCount = useVisibleAisCount(ais.targets, navigation.position, navigation.positionReceivedAt,
        aisVisible && data.isConnected, aisRangeNm);
    const toggleAisAuto = () => {
        if (aisAuto) saveSetting('aisRangeNm', aisRangeNm);
        setAisAuto(previous => !previous);
    };
    const waypoint = useWaypointData(settings.signalKAddress, isLoaded, navigation.position);
    const depthSoundActive = isLoaded && data.isConnected && settings.depthAlarmEnabled && settings.depthAlarmSound
        && navigation.depthMeters > 0 && navigation.depthMeters < settings.depthAlarmMeters;
    const { testSound: testDepthSound, silenceForMinute, remainingSeconds } = useDepthAlarmSound(depthSoundActive);
    const { maxSOG, maxTWS, maxHeel, maxHeelSide, resetSOG, resetTWS, resetHeel } = useSessionMaxima(
        navigation.sogKnots, navigation.twsKnots, navigation.vesselHeelDeg,
    );
    const resetTwsWithHistory = () => { resetTWS(); clearTwsHistory(); };
    const resetSogWithHistory = () => { resetSOG(); clearSogHistory(); };
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isEngineDashboardOpen, setEngineDashboardOpen] = useState(false);
    const [isNightMode, setNightMode] = useState(false);
    const theme = getConsoleTheme(false, navigation.twaCog, settings);
    const gaugeSize = Math.min(Math.min(windowWidth * 0.90, windowHeight * 0.45) * 1.3915, windowWidth * 0.94);
    const isLandscape = windowWidth > windowHeight;
    const pageProps = {
        waypoint, aisAlarm, maxHeel, maxHeelSide, onResetHeel: resetHeel,
        aisVisibleCount, aisRangeNm, aisAuto, onToggleAisAuto: toggleAisAuto,
        onAisRangeChange: value => { setAisAuto(false); saveSetting('aisRangeNm', value); },
        navigation, settings, maxSOG, isConnected: data.isConnected,
        isEngineDashboardOpen, onEngineDashboardVisibilityChange: setEngineDashboardOpen,
        aisVisible, aisTargets: evaluatedAisTargets, aisStatus: ais.status, onToggleAis: () => setAisVisible(previous => !previous),
        isNightMode: false, theme, windowWidth, gaugeSize, twsHistory, sogHistory,
        onSilenceDepth: depthSoundActive && remainingSeconds === 0 ? silenceForMinute : undefined,
        depthSoundMuted: depthSoundActive && remainingSeconds > 0,
    };
    return (
        <LanguageProvider language={settings.language}>
        <AnchorWatchContext.Provider value={anchorWatch}>
        <EngineConsumptionTotalContext.Provider value={engineConsumptionTotal}>
        <EngineHoursContext.Provider value={engineHours}>
        <NightModeContext.Provider value={{ enabled: isNightMode, intensity: settings.nightIntensity, toggle: () => setNightMode(previous => !previous) }}>
        <View style={styles.mainContainer}>
            <UpdateNotice />
            <AisCollisionNotice targets={aisAlertTargets} />
            {isLandscape ? (
                <LandscapeNavigationPage
                    {...pageProps}
                    maxTWS={maxTWS}
                    onOpenSettings={() => setSettingsOpen(true)}
                    onResetSOG={resetSogWithHistory}
                    onResetTWS={resetTwsWithHistory}
                />
            ) : (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                pagingEnabled
                // Restaurar windowWidth * 2 al reactivar TelemetryPage.
                contentContainerStyle={{ width: windowWidth }}
            >
                <NavigationPage
                    {...pageProps}
                    maxTWS={maxTWS}
                    onOpenSettings={() => setSettingsOpen(true)}
                    onResetSOG={resetSogWithHistory}
                    onResetTWS={resetTwsWithHistory}
                />
                {/* Telemetría desactivada temporalmente.
                <TelemetryPage
                    {...pageProps}
                    windowHeight={windowHeight}
                />
                */}
            </ScrollView>
            )}
            <NightDimmer />
            <ConsoleSettingsModal
                visible={isSettingsOpen}
                settings={settings}
                isNightMode={isNightMode}
                onChange={updateSetting}
                onSave={saveSetting}
                onTestDepthSound={testDepthSound}
                onNightModeChange={setNightMode}
                onClose={() => setSettingsOpen(false)}
            />
            {starting && <StartupLauncher ready={isLoaded} connected={data.isConnected} onFinish={finishStartup} />}
        </View>
        </NightModeContext.Provider>
        </EngineHoursContext.Provider>
        </EngineConsumptionTotalContext.Provider>
        </AnchorWatchContext.Provider>
        </LanguageProvider>
    );
}
