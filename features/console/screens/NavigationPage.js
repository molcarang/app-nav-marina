import NavigationControls from '../components/NavigationControls';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import HeadingGauge from '../../../components/gauges/HeadingGauge';
import ConsolePage from '../components/ConsolePage';
import ConnectionHeader from '../components/ConnectionHeader';
import { styles } from '../styles/consoleStyles';
import { isEngineCompactPanelActive } from '../model/engineCompactPanel.js';
/** Primera página: rumbo, viento, profundidad y máximos. */
export default function NavigationPage({ navigation, settings, maxSOG, maxTWS, isConnected, isNightMode, theme, windowWidth, gaugeSize, onOpenSettings, onResetSOG, onResetTWS, twsHistory, sogHistory, onSilenceDepth, depthSoundMuted, aisVisibleCount, aisAuto, onToggleAisAuto, aisRangeNm, onAisRangeChange, aisVisible, aisStatus, onToggleAis, aisTargets, aisAlarm, isEngineDashboardOpen, onEngineDashboardVisibilityChange }) {
    const [panelWidth, setPanelWidth] = useState(0);
    const compassRef = useRef(null);
    const [compassCenterY, setCompassCenterY] = useState(null);
    const pilotWidth = windowWidth * 0.9 / 3;
    const pilotRightInset = Math.max(0, (panelWidth - 3 * (pilotWidth + 6)) / 4) + 3;
    const engineCompactActive = isEngineCompactPanelActive({ connected: isConnected,
        rpm: navigation.engineRpm, sogKnots: navigation.sogKnots });
    return (
        <ConsolePage
            width={windowWidth}
            isNightMode={isNightMode}
        >
            <View style={styles.dataGrid} onLayout={({ nativeEvent }) => setPanelWidth(nativeEvent.layout.width)}>
                <ConnectionHeader showEngineAlarms navigation={navigation} settings={settings} aisTargets={aisTargets}
                    aisAlarm={aisAlarm}
                    compassCenterY={compassCenterY}
                    aisVisibleCount={aisVisibleCount} aisAuto={aisAuto} onToggleAisAuto={onToggleAisAuto} aisRangeNm={aisRangeNm} onAisRangeChange={onAisRangeChange} aisVisible={aisVisible} aisStatus={aisStatus} onToggleAis={onToggleAis}
                    isConnected={isConnected}
                    isNightMode={isNightMode}
                    onOpenSettings={onOpenSettings}
                    onEngineDashboardVisibilityChange={onEngineDashboardVisibilityChange}
                    engineCompactActive={engineCompactActive}
                    showEngineCompactPanel={engineCompactActive && !isEngineDashboardOpen}
                    settingsWidth={pilotWidth}
                    style={{ marginBottom: 5, width: '100%', paddingLeft: '4%', paddingRight: pilotRightInset }}
                />
                <View ref={compassRef} collapsable={false} style={[styles.row, { marginBottom: 30 }]}
                    onLayout={() => compassRef.current?.measureInWindow((_x, y, _width, height) => setCompassCenterY(y + height / 2))}>
                    <HeadingGauge
                        showAis={aisVisible} aisRangeNm={aisRangeNm}
                        aisTargets={aisTargets} position={navigation.position}
                        positionReceivedAt={navigation.positionReceivedAt} isConnected={isConnected}
                        size={gaugeSize * 1.10}
                        headingColor={theme.heading}
                        rotationAngle={-navigation.headingDeg}
                        value={navigation.headingDigital}
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
