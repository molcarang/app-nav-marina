import NavigationControls from '../components/NavigationControls';
import { View } from 'react-native';
import HeadingGauge from '../../../components/gauges/HeadingGauge';
import ConsolePage from '../components/ConsolePage';
import ConnectionHeader from '../components/ConnectionHeader';
import { styles } from '../styles/consoleStyles';
/** Primera página: rumbo, viento, profundidad y máximos. */
export default function NavigationPage({ navigation, settings, maxSOG, maxTWS, isConnected, isNightMode, theme, windowWidth, gaugeSize, onOpenSettings, onResetSOG, onResetTWS }) {
    return (
        <ConsolePage
            width={windowWidth}
            isNightMode={isNightMode}
        >
            <View style={styles.dataGrid}>
                <ConnectionHeader
                    isConnected={isConnected}
                    isNightMode={isNightMode}
                    onOpenSettings={onOpenSettings}
                    style={{ marginBottom: 5 }}
                />
                <View style={[styles.row, { marginBottom: 30 }]}>
                    <HeadingGauge
                        size={gaugeSize}
                        headingColor={theme.heading}
                        rotationAngle={-navigation.cogDeg}
                        value={navigation.cogDigital}
                        awa={navigation.awa}
                        awsKnots={navigation.awsKnots}
                        twsKnots={Number(navigation.twsKnots)}
                        unit="°COG"
                        twd={navigation.twdDeg}
                        twaCog={navigation.twaCog}
                        isNightMode={isNightMode}
                        minLayline={settings.minAnguloCeñida}
                        maxLayline={settings.maxAnguloCeñida}
                        set={navigation.setDeg}
                        drift={navigation.driftKnots}
                    />
                </View>
                <NavigationControls
                    navigation={navigation}
                    settings={settings}
                    maxSOG={maxSOG}
                    maxTWS={maxTWS}
                    isNightMode={isNightMode}
                    theme={theme}
                    windowWidth={windowWidth}
                    onResetSOG={onResetSOG}
                    onResetTWS={onResetTWS}
                />
            </View>
        </ConsolePage>
    );
}
