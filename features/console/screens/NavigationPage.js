import NavigationControls from '../components/NavigationControls';
import { useState } from 'react';
import { View } from 'react-native';
import HeadingGauge from '../../../components/gauges/HeadingGauge';
import ConsolePage from '../components/ConsolePage';
import ConnectionHeader from '../components/ConnectionHeader';
import { styles } from '../styles/consoleStyles';
/** Primera página: rumbo, viento, profundidad y máximos. */
export default function NavigationPage({ navigation, settings, maxSOG, maxTWS, isConnected, isNightMode, theme, windowWidth, gaugeSize, onOpenSettings, onResetSOG, onResetTWS, twsHistory, sogHistory, onSilenceDepth, depthSoundMuted, aisVisible, aisStatus, onToggleAis, aisTargets }) {
    const [panelWidth, setPanelWidth] = useState(0);
    const pilotWidth = windowWidth * 0.9 / 3;
    const pilotRightInset = Math.max(0, (panelWidth - 3 * (pilotWidth + 6)) / 4) + 3;
    return (
        <ConsolePage
            width={windowWidth}
            isNightMode={isNightMode}
        >
            <View style={styles.dataGrid} onLayout={({ nativeEvent }) => setPanelWidth(nativeEvent.layout.width)}>
                <ConnectionHeader
                    aisVisible={aisVisible} aisStatus={aisStatus} onToggleAis={onToggleAis}
                    isConnected={isConnected}
                    isNightMode={isNightMode}
                    onOpenSettings={onOpenSettings}
                    settingsWidth={pilotWidth}
                    style={{ marginBottom: 5, width: '100%', paddingLeft: '4%', paddingRight: pilotRightInset }}
                />
                <View style={[styles.row, { marginBottom: 30 }]}>
                    <HeadingGauge
                        showAis={aisVisible}
                        aisTargets={aisTargets} position={navigation.position}
                        positionReceivedAt={navigation.positionReceivedAt} isConnected={isConnected}
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
                    onSilenceDepth={onSilenceDepth}
                    depthSoundMuted={depthSoundMuted}
                    twsHistory={twsHistory}
                    sogHistory={sogHistory}
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
