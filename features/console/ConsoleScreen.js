import { useMemo, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useSignalKData } from '../../services/signalk/useSignalKData';
import ConsoleSettingsModal from './components/ConsoleSettingsModal';
import { useConsoleSettings } from './hooks/useConsoleSettings';
import { useSessionMaxima } from './hooks/useSessionMaxima';
import { deriveNavigationData } from './model/navigationData';
import NavigationPage from './screens/NavigationPage';
import LandscapeNavigationPage from './screens/LandscapeNavigationPage';
// import TelemetryPage from './screens/TelemetryPage';
import { styles } from './styles/consoleStyles';
import { getConsoleTheme } from './styles/consoleTheme';
/** Coordina datos y acciones. Cada página se ocupa de su presentación. */
export default function ConsoleScreen() {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const { settings, isLoaded, updateSetting, saveSetting } = useConsoleSettings();
    const data = useSignalKData(settings.signalKAddress, isLoaded);
    const navigation = useMemo(() => deriveNavigationData(data), [data]);
    const { maxSOG, maxTWS, resetSOG, resetTWS } = useSessionMaxima(navigation.sogKnots, navigation.twsKnots);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isNightMode, setNightMode] = useState(false);
    const theme = getConsoleTheme(isNightMode, navigation.twaCog, settings);
    const gaugeSize = Math.min(Math.min(windowWidth * 0.90, windowHeight * 0.45) * 1.3915, windowWidth * 0.94);
    const isLandscape = windowWidth > windowHeight;
    const pageProps = {
        navigation, settings, maxSOG, isConnected: data.isConnected,
        isNightMode, theme, windowWidth, gaugeSize,
    };
    return (
        <View style={styles.mainContainer}>
            {isLandscape ? (
                <LandscapeNavigationPage
                    {...pageProps}
                    maxTWS={maxTWS}
                    onOpenSettings={() => setSettingsOpen(true)}
                    onResetSOG={resetSOG}
                    onResetTWS={resetTWS}
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
                    onResetSOG={resetSOG}
                    onResetTWS={resetTWS}
                />
                {/* Telemetría desactivada temporalmente.
                <TelemetryPage
                    {...pageProps}
                    windowHeight={windowHeight}
                />
                */}
            </ScrollView>
            )}
            <ConsoleSettingsModal
                visible={isSettingsOpen}
                settings={settings}
                isNightMode={isNightMode}
                onChange={updateSetting}
                onSave={saveSetting}
                onNightModeChange={setNightMode}
                onClose={() => setSettingsOpen(false)}
            />
        </View>
    );
}
