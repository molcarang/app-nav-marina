import { View } from 'react-native';
import DataSquare from '../../../components/DataSquare';
import HeadingGauge from '../../../components/gauges/HeadingGauge';
import InfoPanel from '../../../components/gauges/InfoPanel';
import ConsolePage from '../components/ConsolePage';
import ConnectionHeader from '../components/ConnectionHeader';
import { getAutopilotInfo } from '../model/autopilot';
import { styles } from '../styles/consoleStyles';
/** Primera página: rumbo, viento, profundidad y máximos. */
export default function NavigationPage({ navigation, settings, maxSOG, maxTWS, isConnected, isNightMode, theme, windowWidth, gaugeSize, onOpenSettings, onResetSOG, onResetTWS }) {
    const columnWidth = windowWidth * 0.94 / 3;
    const apInfo = getAutopilotInfo(navigation.apState);
    const isDepthAlarmActive = navigation.depthMeters > 0 && navigation.depthMeters < 3;
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
                />
                <View style={[styles.row, { marginBottom: 25 }]}>
                    <HeadingGauge
                        size={gaugeSize}
                        headingColor={theme.heading}
                        rotationAngle={-navigation.cogDeg}
                        value={navigation.cogDigital}
                        awa={navigation.awa}
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
                <View style={[styles.row, { marginBottom: 7 }]}>
                    <InfoPanel
                        dataArray={[{ label: 'MAX TWS', value: maxTWS, color: '#79f17bff' }]}
                        color={theme.bg}
                        width={columnWidth}
                    />
                    <InfoPanel
                        dataArray={[{ label: 'MAX SOG', value: maxSOG, color: '#79f17bff' }]}
                        color={theme.bg}
                        width={columnWidth}
                    />
                    <InfoPanel
                        dataArray={[{ label: apInfo.label, value: apInfo.value, color: apInfo.color }]}
                        color={theme.bg}
                        width={columnWidth}
                    />
                </View>
                <View style={styles.row}>
                    <DataSquare
                        label="TWS"
                        value={navigation.twsKnots}
                        unit="KTS"
                        showHistory
                        showProgressBar
                        maxValue={maxTWS}
                        color={theme.bg}
                        onPress={onResetTWS}
                    />
                    <DataSquare
                        label="SOG"
                        value={navigation.sogKnots}
                        unit="KTS"
                        showHistory
                        showProgressBar
                        maxValue={maxSOG}
                        color={theme.bg}
                        onPress={onResetSOG}
                    />
                    <DataSquare
                        label={navigation.twa > 0 ? "TWA (P)" : navigation.twa < 0 ? "TWA (S)" : "TWA"}
                        value={navigation.twa?.toFixed(0) + '°'}
                        unit="DEG"
                        textColor={theme.wind}
                        showStatusDot
                        statusDotColor={theme.statusDot}
                        color={theme.bg}
                    />
                </View>

                <View style={styles.row}>
                    <DataSquare
                        label="COG"
                        value={navigation.cogSquare}
                        unit="TRUE"
                        textColor={theme.heading}
                        color={theme.bg}
                    />
                    <DataSquare
                        label="DEPTH"
                        value={navigation.depthMeters.toFixed(1)}
                        unit="MTRS"
                        color={isDepthAlarmActive ? theme.alarm : theme.bg}
                        textColor={isDepthAlarmActive ? "#fff" : undefined}
                    />

                    <DataSquare
                        label={navigation.awaDigital}
                        value={navigation.awaFixed}
                        unit="DEG"
                        textColor={theme.twd}
                        color={theme.bg}
                    />

                </View>
            </View>
        </ConsolePage>
    );
}
