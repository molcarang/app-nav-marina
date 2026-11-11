import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../../localization/LanguageProvider';
import { GAUGE_THEME } from '../../../styles/GaugeTheme';
import EngineAlarmIndicators from './EngineAlarmIndicators';

export const ENGINE_COMPACT_PANEL_WIDTH = 188;
export const ENGINE_COMPACT_PANEL_HEIGHT = 76;

/** Small engine summary for the navigation screen while the full dashboard is closed. */
export default function EngineCompactPanel({ rpm, currentLitresPerHour, connected, navigation, settings, scale = 1, fullWidth = false }) {
    const { t } = useTranslation();
    const [panelWidth, setPanelWidth] = useState(0);
    const rpmText = Number.isFinite(rpm) && rpm > 0 ? Math.round(rpm).toLocaleString() : '—';
    const consumptionText = Number.isFinite(currentLitresPerHour) && currentLitresPerHour >= 0
        ? currentLitresPerHour.toFixed(2) : '—';
    const fuelValue = connected && Number.isFinite(navigation?.fuelLevelPercent)
        && navigation.fuelLevelPercent >= 0 && navigation.fuelLevelPercent <= 100
        ? Math.round(navigation.fuelLevelPercent).toString() : '—';
    const fuelText = fuelValue === '—' ? fuelValue : `${fuelValue}%`;
    const alarmGap = 3 * scale;
    const indicatorsWidth = 5 * 62.4 * scale;
    // Outer padding, divider spacing and a safety gap keep the first alarm clear of the separator.
    const availableAlarmWidth = Math.max(0, panelWidth - 320 * scale - 28 * scale);
    const alarmWidthScale = panelWidth > 0
        ? Math.max(0.32, Math.min(1, (availableAlarmWidth - 4 * alarmGap) / indicatorsWidth)) : 0.5;

    return <View testID="engine-compact-panel" accessible accessibilityLiveRegion="polite"
        onLayout={({ nativeEvent }) => setPanelWidth(nativeEvent.layout.width)}
        accessibilityLabel={`${t('engineRpmDescription', { value: rpmText })}. ${
            consumptionText === '—' ? t('engineConsumptionNoData')
                : t('engineConsumptionEstimate', { value: consumptionText })}. ${
            fuelValue === '—' ? t('engineFuelNoData') : t('engineFuelDescription', { value: fuelValue })}`}
        style={[styles.panel, {
            width: fullWidth ? '100%' : ENGINE_COMPACT_PANEL_WIDTH * scale,
            height: ENGINE_COMPACT_PANEL_HEIGHT * scale,
            borderRadius: 16 * scale,
            padding: 5 * scale,
        }]}>
        <View pointerEvents="none" style={[styles.innerFrame, {
            top: 2 * scale, right: 2 * scale, bottom: 2 * scale, left: 2 * scale,
            borderRadius: 14 * scale,
        }]} />
        <View style={styles.content}>
            <View style={[styles.readings, { width: 320 * scale }]}>
                <Reading label="RPM" value={rpmText} scale={scale} width={86 * scale} />
                <View style={[styles.separator, { marginVertical: 5 * scale }]} />
                <Reading label={`${t('engineConsumptionTitle')} (L/H)`} value={consumptionText} scale={scale} width={119 * scale} />
                <View style={[styles.separator, { marginVertical: 5 * scale }]} />
                <Reading label={t('engineFuelTitle')} value={fuelText} scale={scale} width={113 * scale} />
            </View>
            <View style={[styles.alarms, { marginLeft: 6 * scale, paddingLeft: 6 * scale }]}>
                <EngineAlarmIndicators compact compactWidthScale={alarmWidthScale}
                    connected={connected} navigation={navigation} settings={settings} />
            </View>
        </View>
    </View>;
}

function Reading({ label, value, scale, width }) {
    return <View style={[styles.reading, { width }]}>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}
            style={[styles.label, { fontSize: 10 * scale }]}>{label}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}
            style={[styles.value, { fontSize: 21 * scale }]}>{value}</Text>
    </View>;
}

const styles = StyleSheet.create({
    panel: {
        backgroundColor: GAUGE_THEME.colors.bg,
        borderWidth: 2,
        borderColor: '#aeb4b8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
        elevation: 5,
    },
    innerFrame: { position: 'absolute', borderWidth: 1, borderColor: '#50585d' },
    content: { flex: 1, flexDirection: 'row', alignItems: 'stretch' },
    readings: { flexDirection: 'row', alignItems: 'stretch' },
    alarms: { flex: 1, alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden',
        borderLeftWidth: 1, borderLeftColor: '#34434d' },
    reading: { minWidth: 0, alignItems: 'center', justifyContent: 'center' },
    separator: { width: 1, backgroundColor: '#34434d' },
    label: { color: '#ff9800', fontFamily: 'NauticalFont', textAlign: 'center', width: '100%' },
    value: { color: '#fff', fontFamily: 'NauticalFont', textAlign: 'center', width: '100%', marginTop: 3 },
});
