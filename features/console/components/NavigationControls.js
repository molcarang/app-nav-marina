import { useTranslation } from '../../../localization/LanguageProvider';
import { View } from 'react-native';
import DataSquare from '../../../components/DataSquare';
import InfoPanel from '../../../components/gauges/InfoPanel';
import NavigationModeLabels from './NavigationModeLabels';
import { getAutopilotInfo } from '../model/autopilot';
import { styles } from '../styles/consoleStyles';

/** Controles compartidos por ambas orientaciones; el contenedor define las dimensiones opcionales. */
export default function NavigationControls({ navigation, settings, maxSOG, maxTWS, isNightMode, theme, windowWidth, onResetSOG, onResetTWS, itemWidth, cardHeight, landscape = false, twsHistory, sogHistory, onSilenceDepth, depthSoundMuted }) {
    const { t } = useTranslation();
    const columnWidth = itemWidth ?? windowWidth * 0.94 / 3;
    const indicatorHeight = 32;
    const apInfo = getAutopilotInfo(navigation.apState);
    const isDepthAlarmActive = settings.depthAlarmEnabled && navigation.depthMeters > 0 && navigation.depthMeters < settings.depthAlarmMeters;
    const modePanel = (
                <NavigationModeLabels
                    itemWidth={itemWidth}
                    offsetY={landscape ? 0 : -10}
                    rudderAngle={navigation.rudderAngle}
                    rudderLimit={settings.rudderLimit}
                    height={indicatorHeight + 15}
                    mode={navigation.navigationMode}
                    windowWidth={windowWidth}
                    isNightMode={isNightMode}
                />
    );
    return <>
                {!landscape && modePanel}
                <View style={[styles.row, { marginTop: -10, marginBottom: 7 }]}>
                    <InfoPanel
                        panelWidth={itemWidth}
                        height={indicatorHeight + 10}
                        dataArray={[{ label: `${t('maximum')} TWS`, value: maxTWS, color: '#79f17bff' }]}
                        isNightMode={isNightMode}
                        color={theme.bg}
                        width={columnWidth}
                    />
                    <InfoPanel
                        panelWidth={itemWidth}
                        height={indicatorHeight + 10}
                        dataArray={[{ label: `${t('maximum')} SOG`, value: maxSOG, color: '#79f17bff' }]}
                        isNightMode={isNightMode}
                        color={theme.bg}
                        width={columnWidth}
                    />
                    <InfoPanel
                        panelWidth={itemWidth}
                        height={indicatorHeight + 10}
                        dataArray={[{ label: t('pilotLabel'), value: t({ AUTO: 'pilotAuto', WIND: 'pilotWind', TRACK: 'pilotTrack', STBY: 'pilotStandby' }[apInfo.value]), color: apInfo.color }]}
                        isNightMode={isNightMode}
                        color={theme.bg}
                        width={columnWidth}
                    />
                </View>
                <View style={styles.row}>
                    <DataSquare
                        width={itemWidth}
                        height={cardHeight}
                        label="TWS"
                        historySamples={twsHistory}
                        historyHours={settings.historyHours}
                        showHistoryPopup
                        isNightMode={isNightMode}
                        value={navigation.twsKnots}
                        unit="KTS"
                        showHistory
                        showProgressBar
                        maxValue={maxTWS}
                        color={theme.bg}
                        onReset={onResetTWS}
                    />
                    <DataSquare
                        width={itemWidth}
                        height={cardHeight}
                        label="SOG"
                        historySamples={sogHistory}
                        historyHours={settings.sogHistoryHours}
                        showHistoryPopup
                        isNightMode={isNightMode}
                        value={navigation.sogKnots}
                        unit="KTS"
                        showHistory
                        showProgressBar
                        maxValue={maxSOG}
                        color={theme.bg}
                        onReset={onResetSOG}
                    />
                    <DataSquare
                        width={itemWidth}
                        height={cardHeight}
                        label={navigation.twa > 0 ? `TWA (${t('portInitial')})` : navigation.twa < 0 ? `TWA (${t('starboardInitial')})` : "TWA"}
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
                        width={itemWidth}
                        height={cardHeight}
                        label="COG"
                        value={navigation.cogSquare}
                        unit="TRUE"
                        textColor={theme.heading}
                        color={theme.bg}
                    />
                    <DataSquare
                        width={itemWidth}
                        height={cardHeight}
                        label={t('depthLabel')}
                        onPress={onSilenceDepth}
                        soundMuted={depthSoundMuted || !settings.depthAlarmEnabled || !settings.depthAlarmSound}
                        value={navigation.depthMeters.toFixed(1)}
                        unit="MTRS"
                        color={isDepthAlarmActive ? theme.alarm : theme.bg}
                        textColor={isDepthAlarmActive ? "#fff" : undefined}
                    />

                    <DataSquare
                        width={itemWidth}
                        height={cardHeight}
                        label={navigation.awaDigital.replace('(P)', `(${t('portInitial')})`).replace('(S)', `(${t('starboardInitial')})`)}
                        value={navigation.awaFixed}
                        unit="DEG"
                        textColor={theme.twd}
                        color={theme.bg}
                    />

                </View>
    </>;
}
