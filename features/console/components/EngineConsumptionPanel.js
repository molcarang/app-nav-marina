import { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../../localization/LanguageProvider';
import { GAUGE_THEME } from '../../../styles/GaugeTheme';
import { EngineConsumptionTotalContext } from '../hooks/useEngineConsumptionTotal';

export const CONSUMPTION_PANEL_WIDTH = 128;
export const CONSUMPTION_PANEL_HEIGHT = 148;

/** Current estimated consumption and persistent litres, with a two-second reset. */
export default function EngineConsumptionPanel({ scale = 1, currentLitresPerHour = null }) {
    const { t } = useTranslation();
    const { totalLitres, ready, error, resetTotal } = useContext(EngineConsumptionTotalContext);
    const current = Number.isFinite(currentLitresPerHour) && currentLitresPerHour >= 0 ? currentLitresPerHour.toFixed(2) : '—';
    const total = ready && Number.isFinite(totalLitres) ? totalLitres.toFixed(2) : '—';
    return <View testID="engine-consumption-panel"
        style={[styles.panel, { width: CONSUMPTION_PANEL_WIDTH * scale,
            height: CONSUMPTION_PANEL_HEIGHT * scale, paddingVertical: 10 * scale, paddingHorizontal: 6 * scale,
            borderRadius: 9 * scale }]}>
        <View pointerEvents="none" style={[styles.innerFrame, {
            top: 2 * scale, right: 2 * scale, bottom: 2 * scale, left: 2 * scale,
            borderRadius: 7 * scale,
        }]} />
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
            style={[styles.title, { fontSize: 11 * scale, marginBottom: 6 * scale }]}>
            {t('engineConsumptionTitle')}
        </Text>
        {[{ label: 'engineConsumptionCurrent', unit: 'L/H', value: current },
            { label: 'engineConsumptionTotal', unit: 'L', value: total }].map(({ label, unit, value }, index) => {
            const Row = index === 0 ? View : TouchableOpacity;
            return <Row key={label} accessible
                accessibilityRole={index === 1 ? 'button' : undefined}
                accessibilityLabel={index === 1 ? t('engineConsumptionTotalDescription', { value: total })
                    : current === '—' ? t('engineConsumptionNoData') : t('engineConsumptionEstimate', { value: current })}
                {...(index === 1 ? { onLongPress: resetTotal, delayLongPress: 2000,
                    disabled: !ready, activeOpacity: 0.6,
                    accessibilityHint: t('engineConsumptionTotalResetHint') } : {})}
                style={[styles.reading, index > 0 && {
                borderTopWidth: 1, borderTopColor: '#34434d', paddingTop: 6 * scale,
            }]}>
                <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, { fontSize: 9 * scale },
                    index === 0 && { transform: [{ translateY: -3 * scale }] }]}>
                    {t(label)} ({unit})
                </Text>
                <View style={styles.valueRow}>
                    <Text testID={index === 0 ? 'engine-consumption-current' : 'engine-consumption-total'} numberOfLines={1} adjustsFontSizeToFit
                        style={[styles.value, { fontSize: Math.min(22, 88 / value.length) * scale }]}>{value}</Text>
                </View>
                {index === 1 && !!error && <Text accessibilityLiveRegion="polite"
                    style={{ color: '#ffad33', fontSize: 7 * scale, textAlign: 'center' }}>{t(error)}</Text>}
            </Row>;
        })}
    </View>;
}

const styles = StyleSheet.create({
    panel: { backgroundColor: GAUGE_THEME.colors.bg, borderWidth: 2, borderColor: '#aeb4b8' },
    innerFrame: { position: 'absolute', borderWidth: 1, borderColor: '#50585d' },
    title: { color: '#ff9800', fontFamily: 'NauticalFont', textAlign: 'center', width: '100%' },
    reading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    label: { color: '#bdcbd5', fontFamily: 'NauticalFont', textAlign: 'center', width: '100%' },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', width: '100%' },
    value: { color: '#fff', fontFamily: 'NauticalFont', flexShrink: 1 },
});
