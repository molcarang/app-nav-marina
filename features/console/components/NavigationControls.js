import { useTranslation } from '../../../localization/LanguageProvider';
import { Text, View } from 'react-native';
import { useControlScale } from '../../../hooks/useControlScale';
import DataSquare from '../../../components/DataSquare';
import InfoPanel from '../../../components/gauges/InfoPanel';
import NavigationModeLabels from './NavigationModeLabels';
import { getAutopilotInfo } from '../model/autopilot';
import { styles } from '../styles/consoleStyles';
import { useDisplayReadings } from '../hooks/useDisplayReadings';
import { getConsoleTheme } from '../styles/consoleTheme';

/** Controles compartidos por ambas orientaciones; el contenedor define las dimensiones opcionales. */
export default function NavigationControls({ navigation, settings, maxSOG, maxTWS, isNightMode, theme, windowWidth, onResetSOG, onResetTWS, itemWidth, cardHeight, landscape = false, twsHistory, sogHistory, onSilenceDepth, depthSoundMuted, onMaxTwsBounds }) {
    const { t } = useTranslation();
    const readings = useDisplayReadings(navigation, settings.displayRefreshSeconds);
    const scale = useControlScale();
    const columnWidth = itemWidth ?? windowWidth * 0.94 / 3;
    const indicatorHeight = 32;
    const apInfo = getAutopilotInfo(navigation.apState);
    const isDepthAlarmActive = settings.depthAlarmEnabled && navigation.depthMeters > 0 && navigation.depthMeters < settings.depthAlarmMeters;
    const displayedDepthWasAlarm = settings.depthAlarmEnabled && readings.depthMeters > 0 && readings.depthMeters < settings.depthAlarmMeters;
    const depth = isDepthAlarmActive || displayedDepthWasAlarm ? navigation.depthMeters : readings.depthMeters;
    const northDirection = value => Number.isFinite(value)
        ? `${String(Math.round(value) % 360).padStart(3, '0')}°` : '—';
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
                        onBounds={onMaxTwsBounds}
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
                        dataArray={[{ label: t('pilotLabel'), value: apInfo.value === '—' ? '—' : t({ AUTO: 'pilotAuto', WIND: 'pilotWind', TRACK: 'pilotTrack', STBY: 'pilotStandby' }[apInfo.value]), color: apInfo.color }]}
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
                        value={readings.twsKnots}
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
                        showHistoryAverage
                        historySamples={sogHistory}
                        historyHours={settings.sogHistoryHours}
                        showHistoryPopup
                        isNightMode={isNightMode}
                        value={readings.sogKnots}
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
                        label={readings.twa > 0 ? `TWA (${t('starboardInitial')})` : readings.twa < 0 ? `TWA (${t('portInitial')})` : "TWA"}
                        value={readings.twa === null ? '—' : Math.abs(readings.twa).toFixed(0) + '°'}
                        unit="DEG"
                        textColor={theme.wind}
                        secondaryText={t('windNorthDirectionShort', { value: northDirection(readings.trueWindDirectionDeg) })}
                        secondaryTextAccessibilityLabel={t('windNorthDirectionDescription', { value: northDirection(readings.trueWindDirectionDeg) })}
                        showStatusDot
                        statusDotColor={getConsoleTheme(isNightMode, readings.twa, settings).statusDot}
                        color={theme.bg}
                    />
                </View>

                <View style={styles.row}>
                    <DataSquare
                        width={itemWidth}
                        height={cardHeight}
                        label="COG"
                        value={readings.cogSquare}
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
                        value={Number.isFinite(depth) ? depth.toFixed(1) : '—'}
                        unit="MTRS"
                        color={isDepthAlarmActive ? theme.alarm : theme.bg}
                        textColor={isDepthAlarmActive ? "#fff" : undefined}
                    />

                    <DataSquare
                        width={itemWidth}
                        height={cardHeight}
                        label={readings.awaDigital.replace('(P)', `(${t('portInitial')})`).replace('(S)', `(${t('starboardInitial')})`)}
                        value={readings.awaFixed}
                        unit="DEG"
                        textColor={theme.twd}
                        secondaryText={t('windNorthDirectionShort', { value: northDirection(readings.apparentWindDirectionDeg) })}
                        secondaryTextAccessibilityLabel={t('windNorthDirectionDescription', { value: northDirection(readings.apparentWindDirectionDeg) })}
                        color={theme.bg}
                    />

                </View>
                {!landscape && <Text numberOfLines={1} style={{ fontFamily: 'NauticalFont', fontSize: 14 * scale,
                    color: '#8fcbdc', textAlign: 'center', marginVertical: 6 * scale }}>
                    {t('waterTemperatureShort')} {Number.isFinite(navigation.waterTemperatureCelsius) ? navigation.waterTemperatureCelsius.toFixed(1) : '—'} °C
                </Text>}
    </>;
}
