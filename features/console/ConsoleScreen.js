import { useMemo, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useSignalKData } from '../../services/signalk/useSignalKData';
import ConsoleSettingsModal from './components/ConsoleSettingsModal';
import { useConsoleSettings } from './hooks/useConsoleSettings';
import { useSessionMaxima } from './hooks/useSessionMaxima';
import { deriveNavigationData } from './model/navigationData';
import NavigationPage from './screens/NavigationPage';
import TelemetryPage from './screens/TelemetryPage';
import { styles } from './styles/consoleStyles';
import { getConsoleTheme } from './styles/consoleTheme';
/** Coordina datos y acciones. Cada página se ocupa de su presentación. */
export default function ConsoleScreen() {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const data = useSignalKData();
    const navigation = useMemo(() => deriveNavigationData(data), [data]);
    const { settings, updateSetting, saveSetting } = useConsoleSettings();
    const { maxSOG, maxTWS, resetSOG, resetTWS } = useSessionMaxima(navigation.sogKnots, navigation.twsKnots);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isNightMode, setNightMode] = useState(false);
    const theme = getConsoleTheme(isNightMode, navigation.twaCog, settings);
    const gaugeSize = Math.min(windowWidth * 0.90, windowHeight * 0.45);
    const pageProps = {
        navigation, settings, maxSOG, isConnected: data.isConnected,
        isNightMode, theme, windowWidth, gaugeSize,
    };
    return (
        <View style={styles.mainContainer}>
            <ScrollView
                horizontal
                pagingEnabled
                contentContainerStyle={{ width: windowWidth * 2 }}
            >
                <NavigationPage
                    {...pageProps}
                    maxTWS={maxTWS}
                    onOpenSettings={() => setSettingsOpen(true)}
                    onResetSOG={resetSOG}
                    onResetTWS={resetTWS}
                />
                <TelemetryPage
                    {...pageProps}
                    windowHeight={windowHeight}
                />
            </ScrollView>
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
