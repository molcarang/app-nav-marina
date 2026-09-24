import { useMemo, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useSignalKData } from '../../services/signalk/useSignalKData';
import { useAisData } from '../../services/signalk/useAisData';
import ConsoleSettingsModal from './components/ConsoleSettingsModal';
import { useConsoleSettings } from './hooks/useConsoleSettings';
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
/** Coordina datos y acciones. Cada página se ocupa de su presentación. */
export default function ConsoleScreen() {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const { settings, isLoaded, updateSetting, saveSetting } = useConsoleSettings();
    const [aisVisible, setAisVisible] = useState(false);
    const ais = useAisData(settings.signalKAddress, isLoaded);
    const { history: twsHistory, clearHistory: clearTwsHistory, recordReading } = useInstrumentHistory(
        'tws', settings.signalKAddress, isLoaded, settings.historyHours,
    );
    const { history: sogHistory, clearHistory: clearSogHistory, recordReading: recordSogReading } = useInstrumentHistory(
        'sog', settings.signalKAddress, isLoaded, settings.sogHistoryHours,
    );
    const data = useSignalKData(settings.signalKAddress, isLoaded, recordReading, recordSogReading);
    const navigation = useMemo(() => deriveNavigationData(data), [data]);
    const depthSoundActive = isLoaded && data.isConnected && settings.depthAlarmEnabled && settings.depthAlarmSound
        && navigation.depthMeters > 0 && navigation.depthMeters < settings.depthAlarmMeters;
    const { testSound: testDepthSound, silenceForMinute, remainingSeconds } = useDepthAlarmSound(depthSoundActive);
    const { maxSOG, maxTWS, resetSOG, resetTWS } = useSessionMaxima(navigation.sogKnots, navigation.twsKnots);
    const resetTwsWithHistory = () => { resetTWS(); clearTwsHistory(); };
    const resetSogWithHistory = () => { resetSOG(); clearSogHistory(); };
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isNightMode, setNightMode] = useState(false);
    const theme = getConsoleTheme(false, navigation.twaCog, settings);
    const gaugeSize = Math.min(Math.min(windowWidth * 0.90, windowHeight * 0.45) * 1.3915, windowWidth * 0.94);
    const isLandscape = windowWidth > windowHeight;
    const pageProps = {
        navigation, settings, maxSOG, isConnected: data.isConnected,
        aisVisible, aisTargets: ais.targets, aisStatus: ais.status, onToggleAis: () => setAisVisible(previous => !previous),
        isNightMode: false, theme, windowWidth, gaugeSize, twsHistory, sogHistory,
        onSilenceDepth: depthSoundActive && remainingSeconds === 0 ? silenceForMinute : undefined,
        depthSoundMuted: depthSoundActive && remainingSeconds > 0,
    };
    return (
        <LanguageProvider language={settings.language}>
        <NightModeContext.Provider value={{ enabled: isNightMode, intensity: settings.nightIntensity }}>
        <View style={styles.mainContainer}>
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
        </View>
        </NightModeContext.Provider>
        </LanguageProvider>
    );
}
